# Default: lint and build the XPI
all: lint build
build:
	web-ext build --artifacts-dir=.build

run:
	web-ext run --firefox-binary=firefox-dev --firefox-profile dev-edition-default

lint:
	web-ext lint

# # Run unit tests
# test: .FORCE
# .FORCE:
# 	jpm test

# clean:
	rm -rf .build
