#!/bin/bash
# Run fingerprint processing tests
#
# Usage:
#   ./run_fingerprint_tests.sh         # Run with live backend
#   ./run_fingerprint_tests.sh offline # Run in offline mode without backend

# Check if offline mode is requested
OFFLINE_MODE=false
if [ "$1" == "offline" ]; then
    OFFLINE_MODE=true
    echo "Running in OFFLINE mode - no backend server will be started"
fi

# Ensure the backend server is running (only if not in offline mode)
BACKEND_PID=""
if [ "$OFFLINE_MODE" == "false" ]; then
BACKEND_PID=$(pgrep -f "manage.py runserver" || echo "")
if [ -z "$BACKEND_PID" ]; then
    echo "Backend server is not running. Starting it now..."
        cd kwelivote-app/backend
    python manage.py runserver &
    BACKEND_PID=$!
    # Wait for server to start
    sleep 5
    echo "Backend server started with PID: $BACKEND_PID"
        # Return to the original directory
        cd ../..
    fi
fi

# Run the test script
echo "Running fingerprint processing tests..."
if [ "$OFFLINE_MODE" == "true" ]; then
    python3 test_fingerprint_processing.py --offline
else
    python3 test_fingerprint_processing.py
fi

# Save the exit code
EXIT_CODE=$?

# Output the result
if [ $EXIT_CODE -eq 0 ]; then
    echo "Tests completed successfully!"
else
    echo "Tests failed with exit code: $EXIT_CODE"
fi

# Ask if the user wants to keep the backend server running (only if we started one)
if [ "$OFFLINE_MODE" == "false" ] && [ ! -z "$BACKEND_PID" ]; then
read -p "Keep the backend server running? (y/n): " KEEP_RUNNING
    if [[ "$KEEP_RUNNING" != "y" && "$KEEP_RUNNING" != "Y" ]]; then
    echo "Stopping backend server..."
    kill $BACKEND_PID
    echo "Backend server stopped."
    fi
fi

exit $EXIT_CODE
