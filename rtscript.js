function countWords() {
    var text = document.getElementById('topic-content').textContent;
    wordCount = text.replace( /[^\w ]/g, "" ).split( /\s+/ ).length;
    let readingTime = Math.floor(wordCount/228) + 1;
    let readingTimeinString = readingTime + " min";

    return readingTimeinString;
}

document.getElementById("reading-time").innerText = "Reading Time: " + countWords();

var coll = document.getElementsByClassName("pop_arrow");

for (let i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var topic_name = this.id + "_content";
        var content = document.getElementById(topic_name);
        // if (content.style.display === "block") {
        //     content.style.display = "none";
        //     this.style.transform = "rotate(135deg)";
        // } else {
        //     content.style.display = "block";
        //     this.style.transform = "rotate(315deg)";
            
        // }
        console.log(content.style.maxHeight)
        if (content.style.maxHeight){
            content.style.maxHeight = null;
            this.style.transform = "rotate(135deg)";
          } else {
            content.style.maxHeight = content.scrollHeight + "px";
            this.style.transform = "rotate(315deg)";
          }
    });
}