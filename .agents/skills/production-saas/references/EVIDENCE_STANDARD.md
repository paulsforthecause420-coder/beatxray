# Release Evidence Standard

PASS requires direct evidence in the relevant environment, such as executed test output, provider tool result, database query, authenticated HTTP request, browser/mobile reproduction, runtime log, release artifact metadata, or verified provider test event.

Use UNVERIFIED when code was only inspected, provider state was not checked, a critical test was skipped, credentials/environment were unavailable, evidence predates relevant changes, only mocks were tested, or local behavior is being used to claim production behavior.

UNVERIFIED is not PASS.

For each critical gate record: gate, environment, timestamp, actor/tool, command/action, expected result, actual result, status, and concise evidence location/output.
