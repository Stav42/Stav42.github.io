function countWordsBattery() {
    var text = document.getElementById('topic-content-battery').textContent;
    wordCount = text.replace( /[^\w ]/g, "" ).split( /\s+/ ).length;
    let readingTime = Math.floor(wordCount/228) + 1;
    let readingTimeinString = readingTime + " min";

    return readingTimeinString;
}

function countWordsSurgical() {
  var text = document.getElementById('topic-content-surgical').textContent;
  wordCount = text.replace( /[^\w ]/g, "" ).split( /\s+/ ).length;
  let readingTime = Math.floor(wordCount/228) + 1;
  let readingTimeinString = readingTime + " min";

  return readingTimeinString;
}


document.getElementById("reading-time-battery").innerText = "Reading Time: " + countWordsBattery();
document.getElementById("reading-time-surgical").innerText = "Reading Time: " + countWordsSurgical();

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
            var height = content.scrollHeight;
            content.style.maxHeight =  height + "px";
            this.style.transform = "rotate(315deg)";
          }
    });
}