#!/usr/bin/env bash

set -o errexit # Exit on error
set -o nounset # Exit on undefined variable
set -o pipefail # Exit on error in piped commands

# Enable tracing if TRACE environment variable is set to 1
if [[ "${TRACE-0}" == "1" ]]; then
    set -o xtrace
fi

# Display help message if -h or --help is provided as the first argument
if [[ "${1-}" =~ ^-*h(elp)?$ ]]; then
    echo 'Usage: ./createRelease.sh v#.#.#'
    exit
fi

cd "$(dirname "$0")" # Change to the directory where the script is located

main() {
    EXPECTED_ARGS=1

    if [ $# -ne $EXPECTED_ARGS ]; then
        echo "Error: Invalid number of arguments." >&2
        echo "Usage: $0 v#.#.#" >&2
        exit 1
    fi

    # Make sure we are on the main branch
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    if [ "$CURRENT_BRANCH" != "main" ]; then
        echo "Error: You must be on the main branch to create a release." >&2
        exit 1
    fi

    # Prompt user with reminders
    read -p "Have you updated the version in the README and committed your changes with a proper commit message? (y/n) " -n 1 -r
    echo    # move to a new line
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Please complete your outstanding tasks before creating a release."
        exit 1
    fi

    # Strip leading v from version number for consistency
    if [[ $1 == v* ]]; then
        VERSION="${1:1}"
    else
        VERSION="$1"
    fi

    rm complete-family-tree-viewer-*.zip 2>/dev/null || true # Remove old zip files if they exist
    zip -r "complete-family-tree-viewer-$1.zip" index.html src/ # Create zip file of the project
    git commit -a -m "Version $VERSION release" # Add zip file to repository
    git push origin main # Push changes to main branch
    git tag -a $1 -m "Version $VERSION release" # Create annotated tag
    git push origin $1 # Push tag to remote repository
    git tag -n # List tags with their messages
}

main "$@"
