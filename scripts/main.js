;(async function () {
    const owidUrl = 'https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/latest/owid-covid-latest.json'
    const owidData = await loadJson(owidUrl)
    const herdImmunity = 0.8
    const flagPath = 'images/flags'
    const fallbackRegion = 'OWID_WRL'
    const fallbackFlag = `sekai`

    const progressBarElem = document.getElementById('progress')
    const flagIconElem = document.getElementById('flag-icon')
    const regionSwitcherListElem = document.getElementById('region-switcher-list')
    const regionSwitcherSearchElem = document.getElementById('region-switcher-search')

    function loadJson(url) {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest()
            xhr.open('GET', url)
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.response))
                } else {
                    reject(Error(xhr.statusText))
                }
            }
            xhr.onerror = () => {
                reject(Error(xhr.statusText))
            }
            xhr.send()
        })
    }

    function parseSearchString(str) {
        if (str.startsWith('?')) str = str.substr(1)

        let result = {}
        let parameters = str.split('&')
        for (let param of parameters) {
            let parts = param.split('=')
            if (parts.length === 0) continue

            let key = decodeURIComponent(parts[0]).trim()
            if (key.length === 0) continue

            let value = decodeURIComponent(parts[1] || '').trim()
            result[key] = value
        }
        return result
    }

    function computeProperties(region) {
        // Vaccination progress
        region.stats.fc_progress_partial = region.stats.people_vaccinated / region.stats.population
        region.stats.fc_progress_full = region.stats.people_fully_vaccinated / region.stats.population

        // Herd immunity forecast
        let requiredVaccinations = 2 * herdImmunity * region.stats.population
        let remainingVaccinations = Math.max(0, requiredVaccinations - region.stats.total_vaccinations)
        let remainingDays = Math.round(remainingVaccinations / region.stats.new_vaccinations_smoothed)
        region.stats.fc_remaining_vaccines = remainingVaccinations
        region.stats.fc_herd_immunity_ms = remainingDays * (24 * 60 * 60 * 1000)
        region.stats.fc_herd_immunity_days = remainingDays

        // Icon
        region.stats.fc_icon_url = `${flagPath}/${findFlagName(region.code)}.svg`
    }

    function injectProperties(region) {
        let targetElements = document.querySelectorAll('[data-key]')
        for (let elem of targetElements) {
            let key = elem.getAttribute('data-key')
            let format = elem.getAttribute('data-format') || 'raw'
            let attr = elem.getAttribute('data-attr')
            let val = Humanize[format](region.stats[key])
            if (!attr) elem.innerText = val
            else elem.setAttribute(attr, val)
        }
    }

    function getSelectedRegionCode() {
        let query = parseSearchString(window.location.search)
        if (!query.region) return fallbackRegion
        if (!owidData[query.region.toUpperCase()]) return fallbackRegion
        return query.region.toUpperCase()
    }

    function getSelectedRegion() {
        let code = getSelectedRegionCode()
        return {
            code,
            stats: owidData[code],
        }
    }

    function findFlagName(iso3) {
        let country = FindCountry(iso3)
        if (country != null) return country.iso2.toLowerCase()
        else return fallbackFlag
    }

    function determineProgressColor(value) {
        const colors = ['#c0392b', '#e74c3c', '#e67e22', '#2ecc71', '#9b59b6']
        const colorBandWidth = 1 / colors.length
        let colorIdx = Math.min(Math.floor(value / colorBandWidth), colors.length - 1)
        return colors[colorIdx]
    }

    function setProgress(value) {
        let humanized = Humanize.percentage(value)

        // Set low-value special styles
        if (value < 0.035) progressBarElem.classList.add('low')
        else progressBarElem.classList.remove('low')

        // Set progress value
        progressBarElem.innerHTML = humanized

        // Set progress color
        progressBarElem.style.setProperty('--progress-color', determineProgressColor(value))
        progressBarElem.style.setProperty('--progress-value', humanized)
    }

    let region = getSelectedRegion()
    computeProperties(region)
    injectProperties(region)
    setProgress(region.stats.fc_progress_full)

    flagIconElem.onerror = () => (flagIconElem.src = `${flagPath}/${fallbackFlag}.svg`)

    for (var regionCode in owidData) {
        let html = `
        <a href="?region=${regionCode}" class="list-group-item list-group-item-action" data-code="${regionCode}">
            <img src="images/flags/${findFlagName(regionCode)}.svg" />
            <span class="country-title">${owidData[regionCode].location}</span>
        </a>`

        let node = document.createElement('a')
        regionSwitcherListElem.appendChild(node)
        node.outerHTML = html
    }

    regionSwitcherSearchElem.oninput = () => {
        let query = regionSwitcherSearchElem.value.toLowerCase()
        let items = regionSwitcherListElem.getElementsByClassName('list-group-item')
        for (let item of items) {
            let regionName = owidData[item.getAttribute('data-code')].location.toLowerCase()
            if (regionName.startsWith(query)) {
                item.style.display = 'block'
            } else {
                item.style.display = 'none'
            }
        }
    }
})()
