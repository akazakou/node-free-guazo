// loading countdown counter for /image/:hash page
$('#duration').ready(function(){
    var element = $('#duration');
    
    element.countdown(new Date(element.data('duration')), function (event) {
        $(this).html(event.strftime('%D days %H:%M:%S'));
    });
});