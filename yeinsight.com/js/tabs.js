function initTabs()
{
    var sets = document.getElementsByTagName("ul");
    for (var i = 0; i < sets.length; i++)
    {
        if (sets[i].className.indexOf("tabset") != -1)
        {
            var tabs = [];
            var links = sets[i].getElementsByTagName("a");
            for (var j = 0; j < links.length; j++)
            {
                if (links[j].className.indexOf("tab") != -1)
                {
                    tabs.push(links[j]);
                    links[j].tabs = tabs;
                    var c = document.getElementById(links[j].href.substr(links[j].href.indexOf("#") + 1));

                    if (c) if (links[j].parentNode.parentNode.className.indexOf("active") != -1) c.style.display = "block";
                    else c.style.display = "none";

                    links[j].onclick = function ()
                    {
                        var c = document.getElementById(this.href.substr(this.href.indexOf("#") + 1));
                        if (c)
                        {
                            for (var i = 0; i < this.tabs.length; i++)
                            {
                                var tab = document.getElementById(this.tabs[i].href.substr(this.tabs[i].href.indexOf("#") + 1));
                                if (tab)
                                {
                                    tab.style.display = "none";
                                }
                                this.tabs[i].parentNode.parentNode.className = this.tabs[i].parentNode.className.replace("active", "");
                            }
                            this.parentNode.parentNode.className += " active";
                            c.style.display = "block";
                            return false;
                        }
                    }
                }
            }
        }
    }
    $("li[class=active]").children().filter(".li-left-text").parent().removeClass("active");
    $("li .li-left-text a[href="+ location.hash+"]").first().parent().parent().addClass("active");
    $(".tab-content[style='display: block;']").css("display","none");
    $(location.hash).css("display","block");
    document.body.scrollTop=0;
}
if (window.addEventListener){
    window.addEventListener("load", initTabs, false);
}
else if (window.attachEvent && !window.opera)
    window.attachEvent("onload", initTabs);
