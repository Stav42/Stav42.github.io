function countWords(sourceId) {
    var source = document.getElementById(sourceId);
    if (!source) return null;
    var text = source.textContent;
    var wordCount = text.replace( /[^\w ]/g, "" ).split( /\s+/ ).length;
    var readingTime = Math.floor(wordCount/228) + 1;
    return readingTime + " min";
}

function setReadingTime(targetId, sourceId) {
    var target = document.getElementById(targetId);
    var readingTime = countWords(sourceId);
    if (target && readingTime) {
        target.innerText = "Reading Time: " + readingTime;
    }
}

setReadingTime("reading-time-battery", "topic-content-battery");
setReadingTime("reading-time-playstation", "topic-content-playstation");

var coll = document.getElementsByClassName("pop_arrow");

for (let i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var topic_name = this.id + "_content";
        var content = document.getElementById(topic_name);
        if (content.style.maxHeight){
            content.style.maxHeight = null;
          } else {
            var height = content.scrollHeight;
            content.style.maxHeight =  height + "px";
          }
    });
}

var triggers = document.getElementsByClassName("collapsible-trigger");
for (let i = 0; i < triggers.length; i++) {
    triggers[i].addEventListener("click", function() {
        var btn = this.querySelector(".pop_arrow");
        if (btn) btn.click();
    });
}