
all: build publish

build: clean
	@scripts/build

publish:
	@scripts/publish

clean:
	@\rm -rf _build

test:
	@echo "TODO: set up test environment"