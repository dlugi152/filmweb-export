function parseDom(dom) {
    let iterator = dom.evaluate('//div[contains(@class, "voteBoxes__box")]',
        dom, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
    let arr = [];
    try {
        let ratingBoxNode = iterator.iterateNext();
        while (ratingBoxNode) {
            let filmwebId = ratingBoxNode.valueOf().getAttribute("data-id");
            let jsonString = dom.evaluate('.//span[contains(@id, "' + filmwebId + '")]',
                dom, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent;
            let rate = JSON.parse(jsonString);

            let title = dom.evaluate('.//div[contains(@class, "filmPreview__originalTitle")]',
                ratingBoxNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (title == null)
                title = dom.evaluate('.//h3[contains(@class, "filmPreview__title")]',
                    ratingBoxNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            let year = dom.evaluate('.//div[contains(@class, "filmPreview__extraYear")]',
                ratingBoxNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            let idTmdb = searchMovie(title.textContent, year.textContent);
            if (idTmdb > 0)
                arr.push({
                    idTmdb: idTmdb,
                    rate: rate.r,
                    date: rate.d
                });
            ratingBoxNode = iterator.iterateNext();
        }
        return arr;
    } catch (e) {
        console.log('Wystąpił problem z parsowaniem strony ' + e);
        return [];
    }
}

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
}

function searchMovie(title, year) {
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET",
        "https://api.themoviedb.org/3/search/movie?api_key=TMDB_API_KEY" +
        "query=" + encodeURIComponent(title) + "&year=" + year,
        false);
    sleep(250);
    xmlhttp.send(); // sleep is needed, because of TMDB API restrictions
    let result = JSON.parse(xmlhttp.responseText);
    if (result["total_results"] > 0)
        return result["results"][0]["id"];
    return -1;
}

function getSourceAsDOM(url) {
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", url, false);
    xmlhttp.send();
    let parser = new DOMParser();
    return parser.parseFromString(xmlhttp.responseText, "text/html");
}

function copyToClipboard(text) {
    let dummy = document.createElement("textarea");
    document.body.appendChild(dummy);
    dummy.value = text;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
}

function main() {
    let ratesNum = document.evaluate('//span[contains(@class, "blockHeader__titleInfoCount")]',
        document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent;
    let pages = Math.ceil(ratesNum / 25);
    let url = window.location.href;
    let allRates = parseDom(document);
    console.log("pobrano " + Math.min(25, ratesNum) + " z " + ratesNum);
    for (let i = 2; i <= pages; i++) {
        let dom = getSourceAsDOM(url + "?page=" + i);
        allRates = allRates.concat(parseDom(dom));
        console.log("pobrano " + Math.min(25 * i, ratesNum) + " z " + ratesNum);
    }
    copyToClipboard(JSON.stringify(allRates));
    console.log("GOTOWE!");
    console.log("Oceny znajdują się w Twoim schowku. Wklej je w formularzu spowrotem na stronie");
    console.log("Twoje oceny:");
    console.log(allRates);
}

main();