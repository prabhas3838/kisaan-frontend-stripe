# Test Output Files - README

## Contents

This folder contains all raw test execution outputs and logs from the Kisan Saathi mobile app testing.

## Files

### Frontend Test Outputs

**`integration_functional_ui_tests.txt`**
- Complete test execution output
- Shows all 47 tests run
- Includes pass/fail status
- Contains error messages for failed tests
- Test timing information

**`full-test-output.txt`**
- Earlier verbose test run
- Complete console output
- All test details

**`test-output.txt`**
- Initial test execution
- Baseline test run data

### Backend Test Outputs

**`backend_tests.txt`**
- Backend test execution log
- Note: Backend tests not implemented yet
- Shows "Error: no test specified"

### Coverage Reports

**`coverage-output.txt`**
- Code coverage statistics
- Coverage by file and directory
- Uncovered line numbers
- Branch and function coverage

### Documentation

**`README.md`** (this file)
- Guide to test output files

**`TEST_EXECUTION_REPORT.md`**
- Detailed analysis of test results
- Pass/fail breakdown
- Performance metrics
- Recommendations

## Quick View

```bash
# View latest test output
cat integration_functional_ui_tests.txt

# View coverage data
cat coverage-output.txt

# View detailed report
cat TEST_EXECUTION_REPORT.md
```

## Test Results Quick Summary

```
Frontend Tests: 41/47 passed (87%)
├── Integration: 6/6 (100%)
├── Regression: 5/5 (100%)
├── Performance: 6/6 (100%)
├── UI: 8/9 (89%)
└── Functional: 13/18 (72%)

Backend Tests: Not implemented
```

## File Sizes

All files are text-based and small (<50KB each), making them easy to view and share.

---

For detailed analysis, see the reports in `../test_report/`
