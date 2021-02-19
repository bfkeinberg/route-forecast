export TOOLS=$HOME/Projects/stash/NEBULA
PATH=~/Projects/stash/MCE/bin:${PATH}:${TOOLS}/wrapper:~/.local/bin:~/Library/Python/3.6/bin
export PATH
export JRE_HOME=$(/usr/libexec/java_home -v 1.8)
export JAVA_HOME=$(/usr/libexec/java_home -v 1.8)
export HISTTIMEFORMAT='%D %T'
export MAPS_KEY='AIzaSyDLmXz6JFen9Y9ZfwFcuJWdrRmq-kBjnKs'
export DARKSKY_API_KEY='9f1075d7f3960b4ec949f0dddae04cfc'
export RWGPS_API_KEY='91a12f680b4e0ef87f500f039c76e449'
export STRAVA_API_KEY='14f3f80e3a99ce401d48009af8105fd6b25373ef'
export TIMEZONE_API_KEY='AIzaSyBS_wyxfIuLDEJWNOKs4w1NqbmwSDjLqCE'
export STRAVA_CLIENT_ID=21996
export BITLY_KEY='R_c745bf113ea94496bda89da42813a5dd'
export BITLY_TOKEN='2404bc27371060258248c4782ad4d242cbca258d'
export AIRNOW_KEY='4604D5DA-8D8C-4693-9D7F-741C63AD4EBF'
export IQAIR_KEY='70261f7e-80d7-477c-ac92-1a453cd59a71'
export PURPLE_AIR_KEY='CDB7F040-F990-11EA-910A-42010A800178'

PS1='\h:\w \u$ '

alias h='history -i'
alias l='ls -CF'
alias ll='ls -alF'
alias j=jobs
alias pd=pushd
alias po=popd
alias idg=" uuidgen | tr -d '\012' | pbcopy"

# The next line updates PATH for the Google Cloud SDK.
if [ -f '/Users/bfeinberg/Downloads/google-cloud-sdk/path.zsh.inc' ]; then source '/Users/bfeinberg/Downloads/google-cloud-sdk/path.zsh.inc'; fi

# The next line enables shell command completion for gcloud.
if [ -f '/Users/bfeinberg/Downloads/google-cloud-sdk/completion.zsh.inc' ]; then source '/Users/bfeinberg/Downloads/google-cloud-sdk/completion.zsh.inc'; fi

# Only load Liquid Prompt in interactive shells, not from a script or from scp
[[ $- = *i* ]] && source ~/liquidprompt/liquidprompt

#export PATH="$HOME/.yarn/bin:$HOME/.config/yarn/global/node_modules/.bin:$PATH"

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

#THIS MUST BE AT THE END OF THE FILE FOR SDKMAN TO WORK!!!
export SDKMAN_DIR="/Users/bfeinberg/.sdkman"
[[ -s "/Users/bfeinberg/.sdkman/bin/sdkman-init.sh" ]] && source "/Users/bfeinberg/.sdkman/bin/sdkman-init.sh"
