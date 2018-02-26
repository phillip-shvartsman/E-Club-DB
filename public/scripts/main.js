var timeout = null;
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
		for(var key in data)
		{
			if(typeof(data[key])=='string'&&data[key]!="")
			{
				newValue = data[key];
				newValue = newValue.replace(/'/g, "");
				newValue = newValue.replace(/"/g, "");
				data[key] = newValue;
			}
		}
		return data;
	};
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
	$('.no-login-input').on('input',function(){
		addNoLoginSearch();
	});
	function addNoLoginSearch(){
		clearTimeout(timeout);
		timeout = setTimeout(function()
		{
			noLoginSearch();
		},750);
	}
	$('#search-tab').on('click',function(){
		$('#search-table-body').empty();
	});
	$('#check-check-out-button').on('click',function(){
		formData = getFormData('#check-check-out-form');
		if(formData['lname']==""||formData['dNum']=="")
		{
			errorFlash('Missing information!');
			return;
		}
		$.ajax({
            method: "POST",
            url: "/check-check-out",
            data: formData,
            success: function( res,status ) {
				$('#your-check-out').empty();
				if(res.length==0)
				{
					errorFlash('Could not find your checkout!');
					return;
				}
				successFlash('Found your checkout!');
				addCheckoutResult(res)
            },
            error: function(err,status){
				
            },
        });
	});
	function errorFlash(error)
	{
		$('#errorFlash').html("<strong>Error!</strong> "+error);
		$('#errorFlash').fadeIn('fast',function(){
			setTimeout(function(){
				$('#errorFlash').fadeOut('fast',function(){
				});
			},1000);
		});
	}
	function successFlash(message)
{
	$('#successFlash').html("<strong>Success!</strong> "+message);
	$('#successFlash').fadeIn('fast',function(){
		setTimeout(function(){
			$('#successFlash').fadeOut('fast',function(){
			});
		},1000);
	});
	}
	function noLoginSearch()
	{
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
				}
            },
            error: function(err,status){
                $('#results-container').empty();
				$('#results-container').append("<p>Error fetching results</p>");
            },
        });
	}
////SEARCH TRIGGERS////
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
	function addCheckoutResult(result)
	{
		var check = "<img class='check-box-all' src='/images/check.png'>";
		var check_part = "<img class='check-box-part' src='/images/check.png'>";
		var plus = "<img class='plus-box' src='/images/plus.png'>";
		var table = "<table class='table table-sm check-out-table' fNum='"+result['fNum']+"' dNum='"+result['dNum']+"' fname='"+result['fname']+"' lname='"+result['lname']+"' value='"+result['_id']+"'>"+
		"<thead>"+
		"<tr>"+
		"</tr>"+
		"</thead>"+
		"<tbody>"+
		"</tbody>"+
		"</table>";
		heading="<th>"+result['fname']+" "+result['lname']+"</th>"+
		"<th>Dot # "+result['dNum']+"</th>"+
		"<th>Due on "+result['dateDue']+"</th>";
		$('#your-check-out').append(table);
		$("[value="+result['_id']+"]").find('thead').find('tr').append(heading);
		toPrint = Object.assign({},result);
		delete toPrint['fname'];
		delete toPrint['lname'];
		delete toPrint['_id'];
		delete toPrint['dateDue'];
		delete toPrint['dNum'];
		delete toPrint['fNum'];
		delete toPrint['checkedIn'];
		if(Object.keys(toPrint).length==1)
		{
			check_part = "";
		}
		for(var key in toPrint)
		{
			jsonData = JSON.parse(toPrint[key]);
			entry = "<tr class='checked-out-part' value='"+jsonData['_id']+"'><td>"+jsonData['amountToCheckOut']+"</td><td>"+jsonData['partName']+"</td><td>"+jsonData['partNum']+"</td><td>"+jsonData['val']+"</td></tr>";
			$("[value="+result['_id']+"]").find('tbody').append(entry);
		} 
	}
	
});
