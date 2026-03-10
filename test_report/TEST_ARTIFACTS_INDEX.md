# Test Reports and Outputs - File Locations

## Generated Test Artifacts

All test execution results, coverage reports, and outputs have been generated and saved in the following locations:

### Test Output Files

1. **Full Test Execution Output**
   - Location: `test-results/full-test-output.txt`
   - Contains: Complete console output from all test runs
   - Size: Text file with verbose test execution logs

2. **Coverage Report (Text)**
   - Location: `test-results/coverage-output.txt`
   - Contains: Text-based coverage statistics
   - Includes: Coverage percentages by file and directory

3. **Test Execution Report**
   - Location: `test-results/TEST_EXECUTION_REPORT.md`
   - Contains: Comprehensive analysis of all test results
   - Includes: Pass/fail rates, performance benchmarks, recommendations

### Coverage Reports (HTML)

**HTML Coverage Report**: `coverage/lcov-report/index.html`

This interactive HTML report includes:
- Line-by-line coverage visualization
- Branch coverage details
- Function coverage
- Clickable file tree
- Color-coded coverage indicators

**To view**: Open `coverage/lcov-report/index.html` in a web browser

### Test Snapshots

**Snapshot Files**: `__tests__/regression/__snapshots__/baseline-snapshots.test.tsx.snap`

Contains:
- Login screen snapshot
- Farmer Dashboard snapshot
- Buyer Dashboard snapshot

### Test Documentation

1. **TEST_DOCUMENTATION.md** (Root directory)
   - Comprehensive testing guide
   - Module interaction diagrams
   - How to run tests
   - Performance benchmarks

2. **Walkthrough** (Artifacts directory)
   - Step-by-step implementation walkthrough
   - Test results summary
   - Files created

## Quick Access

### View Test Results
```bash
cd /home/akash-krishnan/Documents/sriram/kisan-saathi-mobile

# View full test output
cat test-results/full-test-output.txt

# View coverage output
cat test-results/coverage-output.txt

# View execution report
cat test-results/TEST_EXECUTION_REPORT.md

# Open HTML coverage in browser (if in desktop environment)
xdg-open coverage/lcov-report/index.html
```

### Test Result Summary

**Files Created**:
- ✅ `test-results/full-test-output.txt` - Complete test logs
- ✅ `test-results/coverage-output.txt` - Coverage statistics
- ✅ `test-results/TEST_EXECUTION_REPORT.md` - Detailed analysis
- ✅ `coverage/lcov-report/*.html` - Interactive coverage reports
- ✅ `__tests__/**/__snapshots__/*.snap` - Regression snapshots

**Test Execution Data**:
- Total Tests: 47
- Passed: 41 (87%)
- Failed: 6 (13%)
- Execution Time: 19.8 seconds
- Snapshots: 3 (all matching)

**Coverage Data**:
- Overall: 13.46%
- Login Screen: 91.66%
- Farmer Dashboard: 100%
- Buyer Dashboard: 100%

## Integration with CI/CD

These reports can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions usage
- name: Run Tests
  run: npm test -- --coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info

- name: Archive Test Results
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: test-results/
```

## Accessibility

All test outputs are available in multiple formats:
- **Text files**: Easy to read in terminal or text editor
- **Markdown files**: Rendered beautifully in VS Code, GitHub, etc.
- **HTML files**: Interactive browsing with full coverage details
- **Snapshot files**: JSON format for baseline comparison
