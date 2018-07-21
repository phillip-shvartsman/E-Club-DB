//User notification flash
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

//Get form data
function getFormData(formID)
{
	var data = $(formID).serializeArray().reduce(function(obj, item) {
		obj[item.name] = item.value;
		return obj;
	}, {});
	//Take out ' and " characters.
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
}

////Timeout Functions////
//These are used so that a POST request isn't generated on every character entry
var timeout = null; //Timeout for searches
//Create a timeout that can be reset based on a callback
function createTimeout(cb)
{
	clearTimeout(timeout);
	timeout = setTimeout(function()
	{
		cb();
	},500);
}
//Run after a timeout, rebuild the part-search table
function adminPartSearch()
{
	searchAndRebuildTable('#add-form','#search-table-body','result-row',100);
}
//Run after a timeout , checkout search form. Can't pass parameters into a callback.
function searchPartsCheckout()
{
	searchAndRebuildTable('#check-out-search-form','#check-out-search-body','check-out-result-row',15);
}

////Search function////
////Used for part search and checkout part search
//formID: DOM selector for form to take data from and do a search with
//tableID: DOM selector for table BODY to place results in
//rowClass: Class to give each row
//numRows: Number of rows to actually draw, stop after this many
function searchAndRebuildTable(formID,tableID,rowClass,numRows = 100)
{
	//Get data from a form
	var data = getFormData(formID);
	$.ajax({
		method: "POST",
		url: "/search",
		data: data,
		success: function( res,status ) {
			//Rebuild table
			$(tableID).empty();
			if(res.length>0)
			{
				if(res.length>numRows) //Cut extra rows if we don't want to display them
				{
					res = res.splice(0,numRows);
				}
				res.forEach(function(result){
					addToResults(result,tableID,rowClass);
				});
				//Attach handlers for mouse events and row clicks
				assignRowHighlights();
				assignRowClick();
				assignCheckOutClick();
			}
		},
		error: function(err,status){
			$(tableID).empty();
			$(tableID).append("<p>Error fetching results</p>");
		},
	});
} 


////After rebuilding a table need to reapply user interaction events////
//When you click a checkout row, show modal to select how much you want to select
function assignCheckOutClick()
{
	$('.check-out-result-row').on("click",function(){
		uniq_id = $(this).attr('value');
		$("#checkOutStorePart").attr('value',uniq_id);
		$("#qtyModal").modal('show');
	});
}
//Highlight rows
function assignRowHighlights()
{
	$(".result-row").on('mouseenter',function(){
		$(this).css('background-color', 'grey');
	});
	$(".result-row").on('mouseleave',function(){
		$(this).css('background-color', 'transparent');
	});
	$(".check-out-result-row").on('mouseenter',function(){
		$(this).css('background-color', 'grey');
	});
	$(".check-out-result-row").on('mouseleave',function(){
		$(this).css('background-color', 'transparent');
	});
}
function assignRowClick()
{
	$('.result-row').on("click",function(){
		uniq_id = $(this).attr('value');
		$("#storePart").attr('value',uniq_id);
		$("#modify-delete-modal").modal('show');
	});
	$('.cart').on('click',function(){
		$(this).remove();
	});
}

////Add a row////
function addToResults(result,div,optClass)
	{
		//Get template, found in index.pug
		var template = $("#admin-row-template").html();
		result.value = JSON.stringify(result);
		result.optClass = optClass;

		$(div).append(Mustache.to_html(template,result));
	}

//Add a checkout entry
function addCheckoutResult(result)
{
	var check_part = "<img class='check-box-part' src='/images/check.png'>";

	var table_template = $("#admin-checkout-table-template").html();
	var heading_template = $("#admin-checkout-table-heading-template").html();
	var entry_template = $("#admin-checkout-entry").html();

	$('#all-checkouts-container').append(Mustache.to_html(table_template,result));	
	$("[value="+result._id+"]").find('thead').find('tr').append(Mustache.to_html(heading_template,result));
	
	//Copy the result by value
	toPrint = Object.assign({},result);
	//The checkout data contains everything along with the items checked out, delete the checkout data so only the entries remain
	delete toPrint.fname;
	delete toPrint.lname;
	delete toPrint._id;
	delete toPrint.dateDue;
	delete toPrint.dNum;
	delete toPrint.fNum;
	delete toPrint.checkedIn;
	//Don't allow individual check in if there is only one entry in the checkout
	if(Object.keys(toPrint).length==1)
	{
		check_part = "";
	}
	for(var key in toPrint)
	{
		jsonData = JSON.parse(toPrint[key]);
		//Manually add this for MustacheJs
		jsonData.check_part = check_part;
		$("[value="+result._id+"]").find('tbody').append(Mustache.to_html(entry_template,jsonData));
	} 
}
//Checkout form triggers only run when the checkouts are fetched or another is added
function setCheckOutTriggers(){
	//Check in all entries in a checkout
	$('.check-box-all').on('click',function(){
		//LOL get the unique _id of the check box
		var _id =$(this).parent().parent().parent().parent().attr('value');
		//Confirm box for check in all
		$.confirm({
			title: 'Confirmation',
			content: 'Confirm this whole check in?',
			buttons: {
				confirm: function () {
					$.ajax({
						method: "POST",
						url: "/check-in-all",
						data: {
							_id:_id
						},
						success: function( res,status ) {
							successFlash('Checked in all of the parts!');
							$('#all-checkouts-container').empty();
							res.forEach(function(result){
								addCheckoutResult(result);
							});
							setCheckOutTriggers();
							$('#check-out-search-body').empty();
							$('.filter').trigger('input');
						},
						error: function(err,status){
							alert('Error checking in order');
						},
					});
				},
				cancel: function () {
				}
			}
		});
	});
	//Checking in just  part
	$('.check-box-part').on('click',function(){
		//The part _id to check in
		var part_id =$(this).parent().parent().attr('value');
		//The checkout _id to modify
		var checkOut_id=$(this).parent().parent().parent().parent().attr('value');
		$.confirm({
			title: 'Confirmation',
			content: 'Confirm this part checkout',
			buttons: {
				confirm: function () {
				$.ajax({
					method: "POST",
					url: "/check-in-part",
					data: {
						part_id:part_id,
						checkOut_id:checkOut_id
					},
					success: function( res,status ) {
						successFlash('Checked in that part!');
						$('#all-checkouts-container').empty();
						res.forEach(function(result){
							addCheckoutResult(result);
						});
						setCheckOutTriggers();
						$('#check-out-search-body').empty();
						//Apply the filter form data
						$('.filter').trigger('input');
					},
					error: function(err,status){
						alert('Error checking in part');
					},
				});
				},
				cancel: function () {
			
				}
			}
		});
		
	});
	//Add parts from the cart into an already existing checkout
	$('.plus-box').on('click',function(){
		var formData = {};
		$('#current-check-out').children().each(function(){
			partObj = JSON.parse($(this).attr('value')); 
			delete partObj.amountCheckedOut;
			delete partObj.notes;
			delete partObj.qty;
			formData[partObj._id]=JSON.stringify(partObj);
		});
		if(Object.keys(formData).length==0)
		{
			errorFlash('Your current check out is empty!');
			return;
		}
		formData.checkOut_id=$(this).parent().parent().parent().parent().attr('value');
		//No items in the cart
		$.confirm({
			title: 'Confirmation',
			content: 'Confirm this part addition',
			buttons: {
				confirm: function () {
					$.ajax({
						method: "POST",
						url: "/add-part-post-check-out",
						data: formData,
						success: function( res,status ) {
							successFlash('Added those parts!');
							$('#all-checkouts-container').empty();
							res.forEach(function(result){
								addCheckoutResult(result);
							});
							setCheckOutTriggers();
							$('#check-out-search-body').empty();
							//Apply filter data
							$('.filter').trigger('input');
						},
						error: function(err,status){
							alert('Error checking in part');
						},
					});
				},
				cancel: function () {
			
				}
			}
		});
	});
}
////To be run at start////
$(document).ready(function(){
//Filter the current checkouts
	$('.filter').on('input',function(){
		var formData = getFormData('#filter-checkouts');
		//Loop through each of the checkouts
		$('#all-checkouts-container').children().each(function(){
			//Build RegExpressions for Search
			var fnameReg = new RegExp(formData.fname,"i");
			var lnameReg = new RegExp(formData.lname,"i");
			var dNumReg = new RegExp(formData.dNum,"i");
			var fnumReg = new RegExp(formData.fNum,"i");

			//Search using RegExpressions
			var fnameVal = $(this).attr('fname').search(fnameReg);
			var lnameVal = $(this).attr('lname').search(lnameReg);
			var dNumVal = $(this).attr('dnum').search(dNumReg);
			var fnumVal = $(this).attr('fnum').search(fnumReg);
			var sum = fnameVal + lnameVal + dNumVal + fnumVal;
			//Choose whether to display or not
			if(sum>=0)
			{
				$(this).css("display","");
			}
			else
			{
				$(this).css("display","none");
			}
		});
	});

	////USER INTERFACE////
	//Modal options
	$('#modify-delete-modal').modal(
	{
		keyboard:true,
		show:false,
		focus:false
	});
	//Search tab
	$('#search-tab').on('click',function(){
		$('#search-table-body').empty();
	});
	//Logout
	$('#logout').on('click',function(){
		$.ajax({
				method: "GET",
				url: "/logout",
				data:{},
				success: function(res,status) {
					location.reload();
				},
				error: function(err,status){
				},
			});
	});
	//Check out tab
	$('#check-out-tab').on('click',function(){
		//Grab all of the check-outs
		$.ajax({
			method: "POST",
			url: "/get-check-outs",
			data:{},
			success: function(res,status) {
				//Clear table
				$('#all-checkouts-container').empty();
				if(res.length == 0)
				{
				}
				else
				{
					//Loop through and add it
					res.forEach(function(result){
						addCheckoutResult(result);
					});
					setCheckOutTriggers();
					$('#check-out-search-body').empty();
					//Reset those forms
					$('#check-out-search-form').trigger('reset');
					$('#add-check-out-form').trigger('reset');
				}
			},
			error: function(err,status){
				errorFlash("Couldn't grab current checkouts.");
			},
		});
	});
	//Search form for checkout parts
	$("#check-out-cat,#check-out-partName,#check-out-subCat,#check-out-val,#check-out-partNum,#check-out-loc").on('input',function(){
		createTimeout(searchPartsCheckout);
	});
	//Add new checkout
	$('#addCheckOutButton').on('click',function(){
		var formData = getFormData('#add-check-out-form');
		//Missing info for the checkout
		if(formData.fname==""||formData.lname==""||formData.dNum==""||formData.fNum==""||formData.dateDue=="")
		{
			errorFlash('Missing Information about the person checking out!');
			return;
		}
		//Number of parts in checkout is 0
		var numParts = $('#current-check-out').children().length;
		if(numParts==0)
		{
			errorFlash('No items in current check out cart!');
			return;
		}
		//Save each entry into JS memory
		$('#current-check-out').children().each(function(){
			partObj = JSON.parse($(this).attr('value')); 
			delete partObj.amountCheckedOut;
			delete partObj.notes;
			delete partObj.qty;
			formData[partObj._id]=JSON.stringify(partObj);
		});
		//Send that to the server
		$.ajax({
			method: "POST",
			url: "/add-check-out",
			data: formData,
			success: function( res,status ) {
				//Reset those forms
				$('#add-check-out-form').trigger('reset');
				$('#check-out-search-form').trigger('reset');
				$('#current-check-out').empty();
				$('#check-out-tab').trigger('click');
				successFlash('Checkout Added!');
			},
			error: function(err,status){
				if(status == 'error')
				{
					errorFlash('That form number is probably already in use');
				}
				else
				{
					errorFlash('Some error occured talking to the server!');
				}
			},
		});
	});
	//Modify entry button
	$('#modify-button').on('click',function(){
		//When you click on a part in the search menu, its info is stored in #storePart
		partObj = JSON.parse($("#storePart").attr('value'));
		//Set default form values for the modify dat form
		$('#mod-cat').val(partObj.cat);
		$('#mod-partName').val(partObj.partName);
		$('#mod-subCat').val(partObj.subCat);
		$('#mod-val').val(partObj.val);
		$('#mod-partNum').val(partObj.partNum);
		$('#mod-loc').val(partObj.loc);
		$('#mod-qty').val(partObj.qty);
		$('#mod-notes').val(partObj.notes);
		$('#part-options').fadeOut('fast',function(){
			$('#modify-form').fadeIn('fast',function(){
			});
		});
	});
	//Actually send the data to the server for modification in the database
	$('#modifyPart').on('click',function(){
		partObj = JSON.parse($("#storePart").attr('value'));
		var data = getFormData('#modify-form');
		data._id = partObj._id;
		$.ajax({
            method: "POST",
            url: "/modify",
            data: data,
            success: function( res,status ) {
				successFlash('Part was modified!');
				//Hide modal and redo a search
				$("#modify-delete-modal").modal('hide');
				createTimeout(adminPartSearch);
            },
            error: function(err,status){
				alert('Error modifying part');
            },
        });
	});
	//When the modal is hidden, reset the form
	$('#modify-delete-modal').on('hidden.bs.modal',function(){
		$('#modify-form').trigger('reset');
		$('#modify-form').hide();
		$('#part-options').show();
	});
	//Delete
	$('#delete-button').on('click',function(){
		var partObj = JSON.parse($("#storePart").attr('value'));
		var uniq_id = partObj._id;
		//Send the uniq_id of a part to be deleted
		$.confirm({
			title: 'Confirmation',
			content: 'Confirm delete part?',
			buttons: {
				confirm: function () {
					$.ajax({
						method: "POST",
						url: "/delete",
						data: {
							_id : uniq_id
						},
						success: function( res,status ) {
							successFlash('Part was deleted!');
							//New search to update table after deletion
							createTimeout(adminPartSearch);
							$("#storePart").attr('value',"");
							$("[value="+uniq_id+"]").remove();
							$("#modify-delete-modal").modal('hide');
						},
						error: function(err,status){
							alert('Error deleting part');
						},
					});
				},
				cancel: function () {
				},
			}
		});
	});
	//Set quantity for a checkout item
	$("#addQty").on('click',function(){
		var formData = getFormData('#quantity-form');
		if(formData.amountToCheckOut<=0)
		{
			errorFlash('Invalid amount to check out.');
			return;
		}
		$('#quantity-form').trigger('reset');

		partObj = JSON.parse($("#checkOutStorePart").attr('value'));
		partObj.amountToCheckOut = formData.amountToCheckOut;
		var valueWithQty = JSON.stringify(partObj);
		//Find the row clicked copy it and change its class and set relevent data and append it to the cart
		$("[value='"+$("#checkOutStorePart").attr('value')+"']").filter(".check-out-result-row").clone().removeClass('check-out-result-row').addClass('cart').attr('value',valueWithQty).append("<tr'>"+formData.amountToCheckOut+"</tr>").appendTo("#current-check-out");
		assignRowClick();
		$("#qtyModal").modal('hide');
		$('#quantity-form').trigger('reset');
		$('#check-out-search-form').trigger('reset');
		$('#check-out-search-body').empty();
	});
	//Adding a new part
	$("#addPart").on("click", function(){
		var data = getFormData('#add-form');
		if(data.loc==""||data.partName==""||data.qty==""||data.cat=="")
		{
			errorFlash('Must have at least a part name, category, location, and quantity!');
			return;
		}
		$.ajax({
			method: "POST",
			url: "/add",
			data: data,
			success: function( res,status ) {
				successFlash('Part was added!');
				createTimeout(adminPartSearch);
				assignRowHighlights();
				assignRowClick();
			},
			error: function(err,status){
				alert('Error adding part');
			},
		});
	});
	//Add form is also the search form, on change set up a new change
	$(".add-form-input").on('input',function(){
		createTimeout(adminPartSearch);
	});
	//Clear search form, and get a new search with blank selections
	$('#clearAddPart').on('click',function(){
		$('#add-form').trigger('reset');
			createTimeout(adminPartSearch);
		});
});