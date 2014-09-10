# Release build (default)
all: build publish

# Development build
dev: VERSION = dev
dev: all

build: clean
	scripts/build ${VERSION}

publish:
	scripts/publish ${VERSION}

clean:
	@\rm -rf _build
