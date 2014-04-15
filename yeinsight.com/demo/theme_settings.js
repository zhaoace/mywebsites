$(document).ready(function() {
    //hideSettings();
    // show
    $('#show_settings_button').click(function(e) {
        showSettings();
    });
    // hide
    $('#hide_settings_button').click(function(e) {
        hideSettings();
    });
});
function showSettings(){
    $('.theme_settings_container').stop(true,false).animate({left:0,opacity:1});
}
function hideSettings(){
    $('.theme_settings_container').stop(true,false).animate({left:-200,opacity:0});
}
