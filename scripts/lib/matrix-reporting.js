function printMatrixOutcome(result) {
  if (result?.sent) {
    console.log("Matrix: report sent.");
    return;
  }

  if (result?.queued) {
    console.log(`Matrix: API unavailable, report queued (${result.error}).`);
    return;
  }

  if (result?.skipped) {
    console.log(`Running local-only mode: matrix reporting skipped (${result.reason}).`);
  }
}

module.exports = {
  printMatrixOutcome
};
