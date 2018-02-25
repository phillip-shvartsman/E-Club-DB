$(document).ready(function(){
////FUNCTIONS TO RUN AT START////
	$(function () {
		$('[data-toggle="tooltip"]').tooltip();
	})
////DOM MANIPULATION FUNCTIONS////
	function addToResults(result,div)
	{
		$(div).append("<tr class='result-row' value='"+JSON.stringify(result)+"'>"+
		"<td>"+result.partName+"</td>"+
		"<td>"+result.cat+"</td>"+
		"<td>"+result.subCat+"</td>"+
		"<td>"+result.val+"</td>"+
		"<td>"+result.partNum+"</td>"+
		"<td>"+result.loc+"</td>"+
		"<td>"+result.qty+"</td>"+
		"<td>"+result.amountCheckedOut+"</td>"+
		"<td>"+result.notes+"</td>"+
		"</tr>");
	}
	function getFormData(formID)
	{
		var data = $(formID).serializeArray().reduce(function(obj, item) {
			obj[item.name] = item.value;
			return obj;
		}, {});
		return data;
	}
////TRIGGERS ASSIGNMENT FUNCTIONS////
	function assignMouseEvents()
	{
		$(".result-row").on('mouseenter',function(){
			$(this).css('background-color', 'grey');
		});
		$(".result-row").on('mouseleave',function(){
			$(this).css('background-color', 'transparent');
		});
	}
////LOGIN TRIGGERS////
	$("#show-login").on('click',function(){
		$('#show-login').fadeOut('fast',function(){
			$('#login-container').fadeIn('fast',function(){});
		});
	});
////SEARCH TRIGGERS////
    $("#searchPart").on("click", function(){
		var data = getFormData('#search-form');
        $.ajax({
            method: "POST",
            url: "/search",
            data: data,
            success: function( res,status ) {
                $('#search-table-body').empty();
				if(res.length == 0)
				{
				}
				else
				{
					res.forEach(function(result){
						addToResults(result,'#search-table-body');
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
    $('#search-tab').on('click',function(){
		if(!$(this).hasClass('active'))
		{
				$('#check-out-container').fadeOut('fast',function(){
					$('#search-container').fadeIn('fast',function(){
						
					});
				});
				$('#top-nav').find('.active').removeClass('active');
				$('#top-nav').find('#search-tab').addClass('active');
		}
	});
////DOM NAVIGATION////
	$('#check-out-tab').on('click',function(){
		if(!$(this).hasClass('active'))
		{
				$('#search-container').fadeOut('fast',function(){
					$('#check-out-container').fadeIn('fast',function(){
						
					});
				});
				$('#top-nav').find('.active').removeClass('active');
				$('#top-nav').find('#check-out-tab').addClass('active');
				
		}
	});
	
});
