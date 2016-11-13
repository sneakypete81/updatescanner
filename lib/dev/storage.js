var dataText = document.querySelector('#data')
var reloadBtn = document.querySelector('#reload')
var clearBtn = document.querySelector('#clear')
var addFrm = document.querySelector('#add')

reloadBtn.addEventListener('click', reload)
clearBtn.addEventListener('click', clear)
addFrm.addEventListener('submit', add)

function reload() {
  dataText.innerHTML = ""
  browser.storage.local.get().then(
    function(results) {
      if(chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError)
      } else {
        dataText.innerHTML = JSON.stringify(results, null, 4)
      }
    })
}

function clear() {
  browser.storage.local.clear()
  reload()
}

function add(event) {
  event.preventDefault()
  var key = event.target.querySelector("#key").value
  var value = event.target.querySelector("#value").value
  browser.storage.local.set({[key]: value})
  reload()
}

// Display the storage contents once page is loaded
reload()
