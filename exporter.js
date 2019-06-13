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
            arr.push({
                title: title.textContent,
                rate: rate.r,
                date: rate.d,
                year: year.textContent
            });
            ratingBoxNode = iterator.iterateNext();
        }
        return arr;
    } catch (e) {
        console.log('Wystąpił problem z parsowaniem strony ' + e);
        return [];
    }
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