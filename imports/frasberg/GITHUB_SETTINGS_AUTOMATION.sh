#!/bin/bash

################################################################################
# GITHUB SETTINGS AUTOMATION SCRIPT
# Frasberg - Repository Configuration
#
# This script automates all GitHub repository settings changes using the GitHub CLI
# Prerequisites: gh CLI installed and authenticated (gh auth login)
#
# Usage: bash GITHUB_SETTINGS_AUTOMATION.sh [--all|--step N]
################################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
OWNER="FrasbergAI"
OLD_REPO="frasberg"
NEW_REPO="frasberg"
DESCRIPTION="Behavioral governance engine for Frasberg. Includes tonal modulation, hinge logic, membrane protocol, and runtime enforcement modules. Used across Emerald Estates® and Orbit systems for identity-preserving conversational output."

################################################################################
# UTILITY FUNCTIONS
################################################################################

print_header() {
    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}[STEP $1]${NC} $2"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

pause_script() {
    read -p "Press ENTER to continue..." </dev/tty
}

################################################################################
# PREREQUISITE CHECKS
################################################################################

check_prerequisites() {
    print_header "CHECKING PREREQUISITES"
    
    # Check if gh CLI is installed
    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI (gh) is not installed"
        echo ""
        echo "Install GitHub CLI from: https://cli.github.com/"
        exit 1
    fi
    print_success "GitHub CLI (gh) is installed"
    
    # Check if gh is authenticated
    if ! gh auth status &> /dev/null; then
        print_error "GitHub CLI is not authenticated"
        echo ""
        echo "Authenticate with: gh auth login"
        exit 1
    fi
    print_success "GitHub CLI is authenticated"
    
    # Verify repository access
    if ! gh repo view "$OWNER/$OLD_REPO" &> /dev/null; then
        print_error "Cannot access repository: $OWNER/$OLD_REPO"
        exit 1
    fi
    print_success "Repository access verified: $OWNER/$OLD_REPO"
    echo ""
}

################################################################################
# STEP 1: UPDATE DESCRIPTION
################################################################################

update_description() {
    print_step "1" "UPDATING REPOSITORY DESCRIPTION"
    echo ""
    echo "Current description:"
    gh repo view "$OWNER/$OLD_REPO" --json description --jq '.description'
    echo ""
    echo "New description:"
    echo "$DESCRIPTION"
    echo ""
    
    read -p "Continue with description update? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Description update skipped"
        return
    fi
    
    if gh repo edit "$OWNER/$OLD_REPO" --description "$DESCRIPTION"; then
        print_success "Description updated successfully"
        sleep 2
    else
        print_error "Failed to update description"
        return 1
    fi
    echo ""
}

################################################################################
# STEP 2: MAKE REPOSITORY PRIVATE
################################################################################

make_private() {
    print_step "2" "MAKING REPOSITORY PRIVATE"
    echo ""
    
    CURRENT_VISIBILITY=$(gh repo view "$OWNER/$OLD_REPO" --json visibility --jq '.visibility')
    echo "Current visibility: $CURRENT_VISIBILITY"
    echo ""
    
    if [ "$CURRENT_VISIBILITY" = "PRIVATE" ]; then
        print_warning "Repository is already private"
        echo ""
        return
    fi
    
    print_warning "This will make the repository PRIVATE"
    print_warning "⚠️  This means only collaborators will be able to access it"
    echo ""
    
    read -p "Are you sure you want to make this repository PRIVATE? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Privacy change skipped"
        return
    fi
    
    if gh repo edit "$OWNER/$OLD_REPO" --visibility private; then
        print_success "Repository is now PRIVATE"
        sleep 2
    else
        print_error "Failed to make repository private"
        return 1
    fi
    echo ""
}

################################################################################
# STEP 3: DISABLE FORKING
################################################################################

disable_forking() {
    print_step "3" "DISABLING REPOSITORY FORKING"
    echo ""
    
    FORKING_ENABLED=$(gh repo view "$OWNER/$OLD_REPO" --json allowForking --jq '.allowForking')
    echo "Current forking status: $([ "$FORKING_ENABLED" = "true" ] && echo "ENABLED" || echo "DISABLED")"
    echo ""
    
    if [ "$FORKING_ENABLED" = "false" ]; then
        print_warning "Forking is already disabled"
        echo ""
        return
    fi
    
    print_info "This will prevent users from forking the repository"
    echo ""
    
    read -p "Disable forking? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Forking disable skipped"
        return
    fi
    
    if gh repo edit "$OWNER/$OLD_REPO" --allow-forking=false; then
        print_success "Repository forking is now DISABLED"
        sleep 2
    else
        print_error "Failed to disable forking"
        return 1
    fi
    echo ""
}

################################################################################
# STEP 4: VERIFY ALL CHANGES
################################################################################

verify_changes() {
    print_step "4" "VERIFYING ALL CHANGES"
    echo ""
    
    print_info "Fetching current repository settings..."
    echo ""
    
    gh repo view "$OWNER/$OLD_REPO" --json \
        name,description,visibility,allowForking,isPrivate \
        --jq '{
            Repository: .name,
            Description: .description,
            Visibility: .visibility,
            Private: .isPrivate,
            AllowForking: .allowForking
        }' | python3 -m json.tool 2>/dev/null || \
    gh repo view "$OWNER/$OLD_REPO" --json \
        name,description,visibility,allowForking,isPrivate \
        --jq '{
            Repository: .name,
            Description: .description,
            Visibility: .visibility,
            Private: .isPrivate,
            AllowForking: .allowForking
        }'
    
    echo ""
}

################################################################################
# STEP 5: RENAME REPOSITORY (OPTIONAL)
################################################################################

rename_repository() {
    print_step "5" "RENAMING REPOSITORY (OPTIONAL)"
    echo ""
    
    echo "Current name: $OLD_REPO"
    echo "Proposed name: $NEW_REPO"
    echo ""
    
    print_warning "⚠️  Renaming will break all existing git clone URLs and links"
    print_info "You will need to update local git remotes: git remote set-url origin https://github.com/$OWNER/$NEW_REPO.git"
    echo ""
    
    read -p "Do you want to rename the repository? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Repository rename skipped"
        echo ""
        return
    fi
    
    read -p "Enter the new repository name [$NEW_REPO]: " -r
    RENAME_TO="${REPLY:-$NEW_REPO}"
    echo ""
    
    print_warning "Renaming to: $RENAME_TO"
    read -p "Are you absolutely sure? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Repository rename cancelled"
        echo ""
        return
    fi
    
    if gh repo rename "$RENAME_TO" --repo "$OWNER/$OLD_REPO"; then
        print_success "Repository renamed to: $RENAME_TO"
        print_info "Update your local git remote with:"
        echo "    git remote set-url origin https://github.com/$OWNER/$RENAME_TO.git"
        sleep 2
    else
        print_error "Failed to rename repository"
        return 1
    fi
    echo ""
}

################################################################################
# INTERACTIVE MENU
################################################################################

show_menu() {
    echo ""
    echo -e "${YELLOW}FRASBERG - GitHub Settings Configuration${NC}"
    echo ""
    echo "1) Update Repository Description"
    echo "2) Make Repository Private"
    echo "3) Disable Repository Forking"
    echo "4) Verify All Changes"
    echo "5) Rename Repository (OPTIONAL)"
    echo ""
    echo "6) Run ALL steps (1-5) in sequence"
    echo "7) Quick Setup (1-4, skip rename)"
    echo ""
    echo "0) Exit"
    echo ""
    read -p "Select an option (0-7): " -r
}

################################################################################
# MAIN EXECUTION
################################################################################

main() {
    clear
    print_header "FRASBERG - GITHUB SETTINGS AUTOMATION"
    
    # Check prerequisites
    check_prerequisites
    
    # Parse command line arguments
    if [ "$1" = "--all" ]; then
        # Run all steps
        update_description
        make_private
        disable_forking
        verify_changes
        print_header "ALL STEPS COMPLETED"
        print_success "Frasberg repository is now configured!"
        exit 0
    elif [ "$1" = "--quick" ]; then
        # Quick setup (skip rename)
        update_description
        make_private
        disable_forking
        verify_changes
        print_header "QUICK SETUP COMPLETED"
        print_success "Frasberg repository is now configured!"
        exit 0
    fi
    
    # Interactive menu mode
    while true; do
        show_menu
        
        case $REPLY in
            1)
                update_description
                pause_script
                clear
                ;;
            2)
                make_private
                pause_script
                clear
                ;;
            3)
                disable_forking
                pause_script
                clear
                ;;
            4)
                verify_changes
                pause_script
                clear
                ;;
            5)
                rename_repository
                pause_script
                clear
                ;;
            6)
                clear
                print_header "RUNNING ALL STEPS"
                update_description
                make_private
                disable_forking
                verify_changes
                rename_repository
                print_header "ALL STEPS COMPLETED"
                print_success "Frasberg repository is fully configured!"
                pause_script
                clear
                ;;
            7)
                clear
                print_header "RUNNING QUICK SETUP (steps 1-4)"
                update_description
                make_private
                disable_forking
                verify_changes
                print_header "QUICK SETUP COMPLETED"
                print_success "Frasberg repository is now configured!"
                pause_script
                clear
                ;;
            0)
                print_info "Exiting..."
                exit 0
                ;;
            *)
                print_error "Invalid option"
                pause_script
                clear
                ;;
        esac
    done
}

################################################################################
# SCRIPT ENTRY POINT
################################################################################

# Run main function
main "$@"

################################################################################
# END OF SCRIPT
################################################################################
