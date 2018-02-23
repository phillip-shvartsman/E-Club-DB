$(document).ready(function(){
	$(function () {
		$('[data-toggle="tooltip"]').tooltip()
	})
	function addToResults(result)
	{
		$('#results-container').append("<div class='row result-row' value="+result._id+">"+
		"<div class='col'>"+result.partName+"</div>"+
		"<div class='col'>"+result.cat+"</div>"+
		"<div class='col'>"+result.subCat+"</div>"+
		"<div class='col'>"+result.val+"</div>"+
		"<div class='col'>"+result.partNum+"</div>"+
		"<div class='col'>"+result.loc+"</div>"+
		"<div class='col'>"+result.qty+"</div>"+
		"<div class='col'>"+result.amountCheckedOut+"</div>"+
		"<div class='col'>"+result.notes+"</div>"+
		"</div>");
	}
	function getFormData(formID)
	{
		var data = $(formID).serializeArray().reduce(function(obj, item) {
			obj[item.name] = item.value;
			return obj;
		}, {});
		return data;
	}
	$("#show-login").on('click',function(){
		$('#show-login').fadeOut('fast',function(){
			$('#login-container').fadeIn('fast',function(){});
		});
	});
    $("#searchPart").on("click", function(){
		var data = getFormData('#search-form');
        $.ajax({
            method: "POST",
            url: "/search",
            data: data,
            success: function( res,status ) {
                $('#results-container').empty();
				if(res.length == 0)
				{
						$('#results-container').append("<p>No results found</p>");
				}
				else
				{
					res.forEach(function(result){
						addToResults(result);
					});
					assignMouseEvents();
					assignRowClick();
				}
            },
            error: function(err,status){
                $('#results-container').empty();
				$('#results-container').append("<p>Error fetching results</p>");
            },
        });
    });
    
	function assignMouseEvents()
	{
		$(".result-row").on('mouseenter',function(){
			$(this).css('background-color', 'red');
		});
		$(".result-row").on('mouseleave',function(){
			$(this).css('background-color', 'transparent');
		});
	}
	
});
