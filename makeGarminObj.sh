#!/bin/zsh
find ~/Library/Application\ Support/Garmin/ConnectIQ/Devices -name compiler.json -exec cat {} \; | jq -s '.[] | {(.partNumbers[] .number):.displayName}' | jq -s add
