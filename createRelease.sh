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

    # Make sure the correct number of arguments is provided
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

    # Make sure version tag does not already exist
    if git rev-parse "$1" >/dev/null 2>&1; then
        echo "Error: Tag $1 already exists." >&2
        exit 1
    fi

    # Prompt user with reminder
    read -p "Have you committed your changes with a proper commit message? (y/n) " -n 1 -r
    echo    # move to a new line
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Please commit your changes before creating a release."
        exit 1
    fi

    # Get most recent version from git tags
    MOST_RECENT_TAG=$(git describe --tags "$(git rev-list --tags --max-count=1)")
    echo "Most recent tag: $MOST_RECENT_TAG"

    # Update version in the README.md file
    sed -i.bak -E "s/$MOST_RECENT_TAG/$1/g" README.md
    rm README.md.bak

    # Strip leading v from version number for consistency
    if [[ $1 == v* ]]; then
        VERSION="${1:1}"
    else
        VERSION="$1"
    fi

    # Make sure version is present in README.md
    if ! grep -q "$1/complete-family-tree-viewer.$1.zip" README.md; then
        echo "Error: Version $VERSION not found in README.md. Please update the version in README.md before creating a release." >&2
        exit 1
    fi

    rm complete-family-tree-viewer-*.zip 2>/dev/null || true # Remove old zip files if they exist
    zip -r "complete-family-tree-viewer-$1.zip" index.html src/ # Create zip file of the project
    git add .
    git commit -a -m "Version $VERSION release" # Add zip file to repository
    git push origin main # Push changes to main branch
    git tag -a $1 -m "Version $VERSION release" # Create annotated tag
    git push origin $1 # Push tag to remote repository
    git tag -n # List tags with their messages

    # Must be authorized
    # gh auth status
    # gh auth login
    # Github > Settings > Developer settings > Personal access tokens > Tokens (classic) > Generate new token
    # Select scopes: repo, workflow, read:org, admin:public_key

    # Create GitHub release with the zip file as an asset
    gh release create "$1" "complete-family-tree-viewer-$1.zip" \
        --title "Version $VERSION" \
        --notes "Version $VERSION release"
}

main "$@"
