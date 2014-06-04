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

    //set a page goto tab after loading a new page.
    if (location.hash != "")  {
        // click a element to show the tab.
        var toTab = location.hash.substring(0,6);
        var isLv2Tab = (location.hash[6] != null);

        $("a[href='"+toTab+"']").click();
        if ( isLv2Tab ) {
            $("a[href='"+location.hash+"']").click();
        }
        //scroll to header to show the screen.


        var toCaseStudy = (location.hash.lastIndexOf("case-study") > -1 ) ;
        if ( toCaseStudy ) {
            // location.href="#case-study";

            var toCase = location.hash.substr(location.hash.lastIndexOf("case-study") );
            var cases = $(".tab-content[style='display: block;']").find("."+toCase);
            var topOffset = 0;
            for(var i=0;i<cases.size() ;i++){
                if (cases[i].offsetTop > topOffset) {
                    topOffset = cases[i].offsetTop;
                }
            }
            window.scrollTo(0, topOffset);


        } else {
            // location.href="#wrapper";
            window.scrollTo(0, 0);
        }


    }
}



if (window.addEventListener){
    window.addEventListener("load", initTabs, false);
}
else if (window.attachEvent && !window.opera)
    window.attachEvent("onload", initTabs);




jQuery(document).ready(function() {
    $(".footer-quick-links").find("ul").find("li").find("a").on({
        click: function (){
            document.location.href=this.href;
            location.reload();
            location.href="#wrapper";
        }
    });
});





