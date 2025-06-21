let upstream =
  https://github.com/dfinity/vessel-package-set/releases/download/mo-0.14.13-20250617/package-set.dhall sha256:ad097d8ff1c0fa8394a64946ff3c48b65dc7314be2eafa4b70b74fe0dde51799

let Package =
      { name : Text, version : Text, repo : Text, dependencies : List Text }

let additions = [] : List Package

let overrides = [] : List Package

in  upstream # additions # overrides
