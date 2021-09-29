;(function () {
    // Apply templates
    let targetElements = document.querySelectorAll('[data-template]')
    for (let elem of targetElements) {
        let templateName = elem.getAttribute('data-template')
        let templateElement = document.querySelector(`[data-new-template="${templateName}"]`).cloneNode(true)

        let newElement = elem.appendChild(templateElement)
        let slots = elem.querySelectorAll('[data-slot]')
        for (let slot of slots) {
            let slotName = slot.getAttribute('data-slot')
            let slotElement = newElement.querySelector(`[data-new-slot="${slotName}"]`)
            slotElement.outerHTML = slot.innerHTML
        }
        elem.outerHTML = newElement.innerHTML
    }

    // Clean up
    let templateElements = document.querySelectorAll(`[data-new-template]`)
    for (let elem of templateElements) {
        elem.parentNode.removeChild(elem)
    }
})()
