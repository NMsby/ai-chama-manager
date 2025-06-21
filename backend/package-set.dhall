let upstream = https://github.com/dfinity/vessel-package-set/releases/download/mo-0.10.1-20230911/package-set.dhall

let Package =
      { name : Text, version : Text, repo : Text, dependencies : List Text }

let additions = [] : List Package

let overrides = [] : List Package

in  upstream # additions # overrides
