SHELL := /bin/bash

# Default: build the XPI
all: build
build:
	jpm xpi

# Run unit tests
test: .FORCE
.FORCE:
	jpm test

# Launch Firefox dev profile
dev:
	firefox --no-remote -P updatescanner_dev test/dev_page.html

# Automatically post XPI updates to the Firefox dev profile
watchpost:
	jpm watchpost --post-url http://localhost:8888/

# clean:
#     @\rm -rf _build
