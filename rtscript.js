function countWords() {
    var text = document.getElementById('topic-content').textContent;
    wordCount = text.replace( /[^\w ]/g, "" ).split( /\s+/ ).length;
    let readingTime = Math.floor(wordCount/228) + 1;
    let readingTimeinString = readingTime + " min";

    return readingTimeinString;
}

document.getElementById("reading-time").innerText = "Reading Time: " + countWords();
