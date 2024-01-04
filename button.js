  var buttons = document.querySelectorAll('.content_button'); // Select all buttons

  buttons.forEach(function(button) {
      button.addEventListener('click', function () {
          // First, remove 'clicked' class from all buttons
          buttons.forEach(function(otherButton) {
              otherButton.classList.remove('clicked');
              let flag_id = otherButton.id;
              let content_element = document.getElementById(flag_id+"_text")
              // content_element.style.maxHeight = null;
              content_element.style.display = "none";
              // if(flag_id == "battery_blog"){
              //   console.log("flag id: ");
              //   content_element.style.display = "block";
              // }
          });

          // Then, add 'clicked' class to the clicked button
          button.classList.add('clicked');
          let id = button.id;
          let topic_text = id + "_text";
          let content_element = document.getElementById(topic_text);

          var height = content_element.scrollHeight;
          content_element.style.display = "block";
          console.log("Scroll Height: ", content_element.style.maxHeight)
      });
  });
