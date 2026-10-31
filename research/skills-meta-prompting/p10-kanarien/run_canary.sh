#!/bin/bash
# usage: run_canary.sh <id> <prompt>
set -u
ID=$1; PROMPT=$2; S=${SCRATCH:?}; R=/home/user/sidekick/research/skills-meta-prompting
W=$S/canary/ws-$ID; rm -rf $W; mkdir -p $W/.claude/skills; echo "# Kanarien-Fixture" > $W/README.md
for d in /home/user/sidekick/.agents/skills/*/; do cp -r "$d" $W/.claude/skills/; done
G="git -c user.name=fixture -c user.email=fixture@example.invalid"; (cd $W && git init -q && $G add -A && $G commit -qm c1)
python3 $R/skill_pilot.py record-start --ledger $S/ledger-p10.json --trial-id "P10-$ID" --limit 4 --output /dev/stdout >/dev/null || exit 3
KEEP="PATH HOME ANTHROPIC_BASE_URL HTTPS_PROXY HTTP_PROXY NO_PROXY https_proxy http_proxy no_proxy NODE_EXTRA_CA_CERTS SSL_CERT_FILE"; ARGS=""
for k in $KEEP; do v="${!k:-}"; [ -n "$v" ] && ARGS="$ARGS $k=$v"; done
(cd "$W" && timeout 300 env -i $ARGS claude -p "$PROMPT" --output-format stream-json --verbose --setting-sources project \
  --max-budget-usd 0.30 --permission-prompts none --no-session-persistence --tools Read,Glob,Grep,Skill,Write,Edit --allowedTools Write,Edit \
  < /dev/null > $S/canary/$ID.jsonl 2> $S/canary/$ID.err)
echo "exit=$?" > $S/canary/$ID.status
