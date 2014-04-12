export PATH := node_modules/.bin:$(PATH)

all: build publish

build: clean
	scripts/build

publish:
	scripts/publish

clean:
	@\rm -rf _build

.PHONY: test
test:
	mocha

test-spec:
	mocha -R spec

