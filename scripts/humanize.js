;(function () {
    function round(num, decimals) {
        let exp = Math.pow(10, decimals)
        return Math.round(num * exp) / exp
    }

    window.Humanize = {
        raw(v) {
            return v
        },

        number(v) {
            return round(v, 2)
        },

        largenumber(v) {
            const exponents = ['', 'K', 'M', 'G']
            let exponentIdx = 0
            while (v >= 1000 && exponentIdx < exponents.length - 1) {
                v /= 1000
                exponentIdx++
            }
            return round(v, 1) + exponents[exponentIdx]
        },

        percentage(v) {
            return round(v * 100, 2) + '%'
        },

        date(v) {
            let date = new Date(v)
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            })
        },

        dateoffset(v) {
            if (v <= 0) return 'reached.'
            else return this.date(Date.now() + v)
        },
    }
})()
