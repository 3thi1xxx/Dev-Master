package main

import (
	"compress/gzip"
	"context"
	"crypto/sha256"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"math"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

type FileInfo struct {
	Path       string  `json:"path"`
	Size       int64   `json:"size"`
	Mtime      string  `json:"mtime"`
	SHA256     string  `json:"sha256"`
	TrustScore float64 `json:"trust_score"`
	Agent      string  `json:"agent"`
}

type FailedFile struct {
	Path   string `json:"path"`
	Reason string `json:"skip_reason"`
	Size   int64  `json:"size"`
}

type ManifestResult struct {
	Files         []FileInfo   `json:"files"`
	FailedFiles   []FailedFile `json:"failed_files"`
	TotalFiles    int64        `json:"total_files"`
	ProcessedFiles int64       `json:"processed_files"`
	FailedCount   int64        `json:"failed_count"`
	TotalSize     int64        `json:"total_size"`
	ProcessingTime string      `json:"processing_time"`
	SuccessRate   float64     `json:"success_rate"`
}

type ProgressTracker struct {
	processed    int64
	failed       int64
	totalSize    int64
	startTime    time.Time
	lastPrint    time.Time
	printMutex   sync.Mutex
}

type CircuitBreaker struct {
	failures    int64
	lastFailure time.Time
	threshold   int64
	timeout     time.Duration
	mutex       sync.Mutex
}

type WorkerPool struct {
	workers     int
	jobs        chan string
	results     chan FileInfo
	errors      chan FailedFile
	wg          sync.WaitGroup
	ctx         context.Context
	cancel      context.CancelFunc
	basePath    string
	dryRun      bool
	progress    *ProgressTracker
	breaker     *CircuitBreaker
}

func NewCircuitBreaker(threshold int64, timeout time.Duration) *CircuitBreaker {
	return &CircuitBreaker{
		threshold: threshold,
		timeout:   timeout,
	}
}

func (cb *CircuitBreaker) Call(fn func() error) error {
	cb.mutex.Lock()
	defer cb.mutex.Unlock()

	// Check if circuit is open
	if cb.failures >= cb.threshold {
		if time.Since(cb.lastFailure) < cb.timeout {
			return fmt.Errorf("circuit breaker open")
		}
		// Reset after timeout
		cb.failures = 0
	}

	err := fn()
	if err != nil {
		cb.failures++
		cb.lastFailure = time.Now()
	}

	return err
}

func NewProgressTracker() *ProgressTracker {
	return &ProgressTracker{
		startTime: time.Now(),
		lastPrint: time.Now(),
	}
}

func (pt *ProgressTracker) Update(processed, failed, size int64) {
	atomic.AddInt64(&pt.processed, processed)
	atomic.AddInt64(&pt.failed, failed)
	atomic.AddInt64(&pt.totalSize, size)

	pt.printMutex.Lock()
	defer pt.printMutex.Unlock()

	now := time.Now()
	if now.Sub(pt.lastPrint) >= time.Second {
		pt.printProgress()
		pt.lastPrint = now
	}
}

func (pt *ProgressTracker) printProgress() {
	processed := atomic.LoadInt64(&pt.processed)
	failed := atomic.LoadInt64(&pt.failed)
	totalSize := atomic.LoadInt64(&pt.totalSize)
	elapsed := time.Since(pt.startTime)

	rate := float64(processed) / elapsed.Seconds()
	
	fmt.Printf("\r📊 Processed: %d | ❌ Failed: %d | 📦 Size: %s | ⚡ Rate: %.1f files/sec | ⏱️  %v",
		processed, failed, formatBytes(totalSize), rate, elapsed.Round(time.Second))
}

func (pt *ProgressTracker) FinalStats() (int64, int64, int64, time.Duration) {
	return atomic.LoadInt64(&pt.processed),
		atomic.LoadInt64(&pt.failed),
		atomic.LoadInt64(&pt.totalSize),
		time.Since(pt.startTime)
}

func formatBytes(bytes int64) string {
	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}
	div, exp := int64(unit), 0
	for n := bytes / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(bytes)/float64(div), "KMGTPE"[exp])
}

func NewWorkerPool(workers int, basePath string, dryRun bool) *WorkerPool {
	ctx, cancel := context.WithCancel(context.Background())
	return &WorkerPool{
		workers:  workers,
		jobs:     make(chan string, workers*2),
		results:  make(chan FileInfo, workers),
		errors:   make(chan FailedFile, workers),
		ctx:      ctx,
		cancel:   cancel,
		basePath: basePath,
		dryRun:   dryRun,
		progress: NewProgressTracker(),
		breaker:  NewCircuitBreaker(100, 30*time.Second),
	}
}

func (wp *WorkerPool) Start() {
	for i := 0; i < wp.workers; i++ {
		wp.wg.Add(1)
		go wp.worker(i)
	}
}

func (wp *WorkerPool) Stop() {
	close(wp.jobs)
	wp.wg.Wait()
	wp.cancel()
	close(wp.results)
	close(wp.errors)
}

func (wp *WorkerPool) AddJob(filePath string) {
	select {
	case wp.jobs <- filePath:
	case <-wp.ctx.Done():
		return
	}
}

func (wp *WorkerPool) worker(id int) {
	defer wp.wg.Done()

	for filePath := range wp.jobs {
		select {
		case <-wp.ctx.Done():
			return
		default:
		}

		// Use circuit breaker for resilience
		err := wp.breaker.Call(func() error {
			return wp.processFile(filePath)
		})

		if err != nil {
			wp.errors <- FailedFile{
				Path:   filePath,
				Reason: err.Error(),
				Size:   0,
			}
			wp.progress.Update(0, 1, 0)
		}
	}
}

func (wp *WorkerPool) processFile(filePath string) error {
	// Convert to absolute path first
	absPath, err := filepath.Abs(filePath)
	if err != nil {
		return fmt.Errorf("failed to get absolute path for %s: %w", filePath, err)
	}

	info, err := os.Stat(absPath)
	if err != nil {
		return fmt.Errorf("failed to stat file: %w", err)
	}

	if info.IsDir() {
		return fmt.Errorf("is directory")
	}

	// Check memory pressure
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	if m.Alloc > 2*1024*1024*1024 { // 2GB threshold
		runtime.GC()
		runtime.ReadMemStats(&m)
		if m.Alloc > 1.5*1024*1024*1024 { // Still high after GC
			return fmt.Errorf("memory pressure too high")
		}
	}

	var hash string
	if !wp.dryRun {
		hash, err = calculateSHA256(absPath)
		if err != nil {
			return fmt.Errorf("failed to calculate hash: %w", err)
		}
	} else {
		hash = "dry-run-hash"
	}

	relPath, err := getRelativePath(wp.basePath, absPath)
	if err != nil {
		return fmt.Errorf("failed to get relative path: %w", err)
	}

	fileInfo := FileInfo{
		Path:       relPath,
		Size:       info.Size(),
		Mtime:      info.ModTime().UTC().Format(time.RFC3339),
		SHA256:     hash,
		TrustScore: calculateTrustScore(relPath, info.Size()),
		Agent:      classifyAgent(relPath),
	}

	wp.results <- fileInfo
	wp.progress.Update(1, 0, info.Size())
	return nil
}

func getRelativePath(basePath, targetPath string) (string, error) {
	// Ensure both paths are absolute before calling filepath.Rel
	absBase, err := filepath.Abs(basePath)
	if err != nil {
		return "", fmt.Errorf("failed to get absolute base path: %w", err)
	}

	absTarget, err := filepath.Abs(targetPath)
	if err != nil {
		return "", fmt.Errorf("failed to get absolute target path: %w", err)
	}

	return filepath.Rel(absBase, absTarget)
}

func calculateSHA256(filePath string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil {
		return "", err
	}

	return fmt.Sprintf("%x", hash.Sum(nil)), nil
}

func calculateTrustScore(path string, size int64) float64 {
	score := 0.5 // Base score

	// File type bonuses
	ext := strings.ToLower(filepath.Ext(path))
	switch ext {
	case ".go", ".py", ".js", ".ts", ".java", ".cpp", ".c", ".rs":
		score += 0.2
	case ".txt", ".md", ".json", ".yaml", ".yml":
		score += 0.15
	case ".exe", ".bin", ".dll", ".so":
		score -= 0.3
	}

	// Size penalties
	if size > 100*1024*1024 { // > 100MB
		score -= 0.2
	} else if size > 10*1024*1024 { // > 10MB
		score -= 0.1
	}

	// Path-based adjustments
	lowerPath := strings.ToLower(path)
	if strings.Contains(lowerPath, "node_modules") || strings.Contains(lowerPath, ".git") {
		score -= 0.25
	}
	if strings.Contains(lowerPath, "test") || strings.Contains(lowerPath, "spec") {
		score += 0.1
	}

	// Clamp between 0 and 1
	if score < 0 {
		score = 0
	} else if score > 1 {
		score = 1
	}

	return math.Round(score*100) / 100
}

func classifyAgent(path string) string {
	ext := strings.ToLower(filepath.Ext(path))
	
	switch ext {
	case ".js", ".jsx", ".mjs", ".cjs":
		return "javascript"
	case ".ts", ".tsx":
		return "typescript"
	case ".py":
		return "python"
	case ".go":
		return "golang"
	case ".java":
		return "java"
	case ".cpp", ".cc", ".cxx", ".c":
		return "cpp"
	case ".rs":
		return "rust"
	case ".php":
		return "php"
	case ".rb":
		return "ruby"
	case ".json", ".yaml", ".yml", ".toml":
		return "config"
	case ".md", ".txt":
		return "documentation"
	case ".html", ".css", ".scss", ".sass":
		return "web"
	case ".sql":
		return "database"
	case ".sh", ".bash", ".zsh":
		return "shell"
	case ".dockerfile", ".docker":
		return "docker"
	default:
		if strings.Contains(strings.ToLower(path), "dockerfile") {
			return "docker"
		}
		if strings.Contains(strings.ToLower(path), "makefile") {
			return "build"
		}
		return "unknown"
	}
}

func discoverFiles(rootPath string) ([]string, error) {
	var files []string
	
	err := filepath.Walk(rootPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil // Continue despite errors
		}

		if info.IsDir() {
			// Skip common directories that should be ignored
			dirName := strings.ToLower(info.Name())
			if dirName == "node_modules" || dirName == ".git" || dirName == ".svn" ||
			   dirName == "__pycache__" || dirName == ".pytest_cache" {
				return filepath.SkipDir
			}
			return nil
		}

		// Convert relative paths from filepath.Walk to absolute paths
		absPath, err := filepath.Abs(path)
		if err != nil {
			return fmt.Errorf("failed to get absolute path for %s: %w", path, err)
		}

		files = append(files, absPath)
		return nil
	})

	return files, err
}

func main() {
	// Command line flags
	var (
		dirFlag     = flag.String("dir", ".", "Directory to scan")
		outputFlag  = flag.String("output", "", "Output file (default: stdout)")
		workersFlag = flag.Int("workers", runtime.NumCPU(), "Number of worker goroutines")
		dryRunFlag  = flag.Bool("dry-run", false, "Skip hash calculation for speed testing")
		compressFlag = flag.Bool("compress", false, "Compress output with gzip")
		verboseFlag = flag.Bool("verbose", false, "Enable verbose logging")
	)
	flag.Parse()

	fmt.Printf("🚀 Starting manifest generation...\n")
	fmt.Printf("📁 Directory: %s\n", *dirFlag)
	fmt.Printf("👥 Workers: %d\n", *workersFlag)
	if *dryRunFlag {
		fmt.Printf("🏃 Dry run mode: enabled\n")
	}

	// Discover all files
	fmt.Printf("🔍 Discovering files...\n")
	files, err := discoverFiles(*dirFlag)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error discovering files: %v\n", err)
		os.Exit(1)
	}

	if len(files) == 0 {
		fmt.Printf("⚠️  No files found in directory: %s\n", *dirFlag)
		os.Exit(1)
	}

	fmt.Printf("📊 Found %d files to process\n", len(files))
	fmt.Printf("💪 Worker pool initialized with %d workers\n", *workersFlag)

	// Create worker pool
	wp := NewWorkerPool(*workersFlag, *dirFlag, *dryRunFlag)
	wp.Start()

	// Start result collection
	var results []FileInfo
	var failed []FailedFile
	var resultWg sync.WaitGroup
	
	resultWg.Add(1)
	go func() {
		defer resultWg.Done()
		for result := range wp.results {
			results = append(results, result)
			if *verboseFlag {
				fmt.Printf("✅ Processing: %s (%s)\n", result.Path, formatBytes(result.Size))
			}
		}
	}()

	resultWg.Add(1)
	go func() {
		defer resultWg.Done()
		for failure := range wp.errors {
			failed = append(failed, failure)
			if *verboseFlag {
				fmt.Printf("❌ Failed: %s - %s\n", failure.Path, failure.Reason)
			}
		}
	}()

	// Process all files
	for _, file := range files {
		wp.AddJob(file)
	}

	// Wait for completion
	wp.Stop()
	resultWg.Wait()

	// Clear progress line
	fmt.Printf("\r" + strings.Repeat(" ", 100) + "\r")

	// Final statistics
	processed, failedCount, totalSize, elapsed := wp.progress.FinalStats()
	successRate := float64(processed) / float64(len(files)) * 100

	fmt.Printf("\n=== FINAL RESULTS ===\n")
	fmt.Printf("✅ Processed: %d files\n", processed)
	fmt.Printf("❌ Failed: %d files\n", failedCount)
	fmt.Printf("📊 Success Rate: %.1f%%\n", successRate)
	fmt.Printf("📦 Total Size: %s\n", formatBytes(totalSize))
	fmt.Printf("⚡ Total Time: %v\n", elapsed.Round(time.Millisecond))
	fmt.Printf("🔥 Processing Rate: %.1f files/sec\n", float64(processed)/elapsed.Seconds())

	// Generate final manifest
	manifest := ManifestResult{
		Files:          results,
		FailedFiles:    failed,
		TotalFiles:     int64(len(files)),
		ProcessedFiles: processed,
		FailedCount:    failedCount,
		TotalSize:      totalSize,
		ProcessingTime: elapsed.String(),
		SuccessRate:    successRate,
	}

	// Output results
	var output io.Writer = os.Stdout
	if *outputFlag != "" {
		file, err := os.Create(*outputFlag)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error creating output file: %v\n", err)
			os.Exit(1)
		}
		defer file.Close()

		if *compressFlag {
			gzWriter := gzip.NewWriter(file)
			defer gzWriter.Close()
			output = gzWriter
		} else {
			output = file
		}
	}

	encoder := json.NewEncoder(output)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(manifest); err != nil {
		fmt.Fprintf(os.Stderr, "Error encoding JSON: %v\n", err)
		os.Exit(1)
	}

	if *outputFlag != "" {
		fmt.Printf("📄 Output written to: %s\n", *outputFlag)
		if *compressFlag {
			fmt.Printf("🗜️  Compression: enabled\n")
		}
	}

	if successRate < 80 {
		fmt.Printf("⚠️  Low success rate detected. Check error messages above.\n")
		os.Exit(1)
	}

	fmt.Printf("🎉 Manifest generation completed successfully!\n")
}
