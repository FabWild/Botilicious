$("#parler").click(function(){
  console.log($("#message").val());
  $.post("/main/postamessage",
  {
    message : $("#message").val()
  },
  function(data, status){
    console.log(data);
    $('#chatwindow').prepend('Weather ('+data.Time+' City: '+data.City+' ('+data.Country+') ): '+data.Weather+' '+data.Temperature+'°C');
  });
});