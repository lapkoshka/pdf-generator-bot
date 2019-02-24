#!/bin/bash

# Telegram bot token
export TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11

# Url of page any login form
export LOGIN_PAGE=https://anycite.com/login.php

# Login form selectors
export USERNAME_SELECTOR="#login_input"
export PASSWORD_SELECTOR="#pass_input"
export SUBMIT_SELECTOR="#submit_button"

# Credentials
export LOGIN=test@domain.com
export PASS='qwerty'

## Bot settings
# Telegram account who will receive reports from users
export OWNER_TG_ACC=@durov
# Regexp for pages witch have to be saved
export URL_REGEXP="^https:\/\/domain.com\/[0-9]{4}\/[0-9]{2}\/[0-9]{2}\/(.*)"
# Error text in case of regexp mismatch
export URL_MISMATCH_TEXT_ERROR="My domain article url only"

export REQUEST_TIMEOUT="60000"
export USERS_PATH=users.json

echo "Bot starting..."
/usr/local/bin/node build/index.js
