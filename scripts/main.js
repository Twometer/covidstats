;(async function () {
    const owidUrl = 'https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/latest/owid-covid-latest.json'
    const owidData = await loadJson(owidUrl)
    const herdImmunity = 0.8
    const flagPath = 'images/flags'
    const fallbackRegion = 'OWID_WRL'
    const fallbackFlag = `${flagPath}/sekai.svg`

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

    function computeForecast(region) {
        // Vaccination progress
        region.fc_progress_partial = region.people_vaccinated / region.population

        region.fc_progress_full = region.people_fully_vaccinated / region.population

        // Herd immunity forecast
        let requiredVaccinations = 2 * herdImmunity * region.population
        let remainingVaccinations = Math.max(0, requiredVaccinations - region.total_vaccinations)
        let remainingDays = Math.round(remainingVaccinations / region.new_vaccinations_smoothed)
        region.fc_remaining_vaccines = remainingVaccinations
        region.fc_herd_immunity_ms = remainingDays * (24 * 60 * 60 * 1000)
        region.fc_herd_immunity_days = remainingDays
    }

    function injectData(region) {
        let regionData = owidData[region]
        computeForecast(regionData)
        regionData.fc_icon_url = `${flagPath}/${convertCountryCode(region)}.svg`

        let targetElements = document.querySelectorAll('[data-key]')
        for (let elem of targetElements) {
            let key = elem.getAttribute('data-key')
            let format = elem.getAttribute('data-format') || 'raw'
            let attr = elem.getAttribute('data-attr')
            let val = Humanize[format](regionData[key])
            if (!attr) elem.innerText = val
            else elem.setAttribute(attr, val)
        }
        console.log(regionData)
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

    function getRegionParameter() {
        let query = parseSearchString(window.location.search)
        if (!query.region) return fallbackRegion
        if (!owidData[query.region.toUpperCase()]) return fallbackRegion
        return query.region.toUpperCase()
    }

    function convertCountryCode(iso3) {
        let country = FindCountry(iso3)
        if (country != null) return country.iso2.toLowerCase()
        else return ''
    }

    let region = getRegionParameter()
    injectData(region)

    let flagIcon = document.getElementById('flag-icon')
    flagIcon.onerror = () => {
        flagIcon.src = fallbackFlag
    }
})()
