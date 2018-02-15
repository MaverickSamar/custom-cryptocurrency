App = {
  web3Provider: null,
  contracts: {},
  names: new Array(),
  minter:null,
  currentAccount:null,
  transaction:0,
  flag:false,
  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
        // Is there is an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fallback to the TestRPC
      App.web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');
    }
    web3 = new Web3(App.web3Provider);
    App.populateAddress();
    return App.initContract();
  },

  initContract: function() {
      $.getJSON('Coin.json', function(data) {
    // Get the necessary contract artifact file and instantiate it with truffle-contract
    var voteArtifact = data;
    App.contracts.vote = TruffleContract(voteArtifact);

    // Set the provider for our contract
    App.contracts.vote.setProvider(App.web3Provider);

    // Use our contract to retrieve and mark the voted pets
    // return App.markvoted();     // TOD
    //App.getMinter().then(function(){
      App.getMinter();
      App.currentAccount = web3.eth.coinbase;
     jQuery('#current_account').text("Current account : "+web3.eth.coinbase);
      App.handleEvents();
    return App.bindEvents();
    //});

  });
    //return App.bindEvents();
  },

  bindEvents: function() {

    $(document).on('click', '#create_money', function(){ App.handleCreateMoney(jQuery('#enter_create_address').val(),jQuery('#create_amount').val()); });
    $(document).on('click', '#send_money', function(){ App.handleSendMoney(jQuery('#enter_send_address').val(),jQuery('#send_amount').val()); });
    $(document).on('click', '#balance', function(){ App.checkBalance(); });
  },


populateAddress : function(){
 new Web3(new Web3.providers.HttpProvider('http://localhost:7545')).eth.getAccounts((err, accounts) => {
  jQuery.each(accounts,function(i){
    var optionElement = '<option value="'+accounts[i]+'">'+accounts[i]+'</option';
    jQuery('#enter_create_address').append(optionElement);
    jQuery('#enter_send_address').append(optionElement);
  });



  });
},

handleEvents : function(){
  var coinInstance;
  App.contracts.vote.deployed().then(function(instance) {
    coinInstance = instance;
    var option = {
      "fromBlock": "latest"
    };
    var event = coinInstance.allEvents(option);
    event.watch(function(error,result) {

      if(result.transactionHash != App.transaction){
        App.transaction = result.transactionHash;
        var text = 'Coin transfer: ' + result.args.amount +
            ' coins were sent from ' + result.args.from +
            ' to ' + result.args.to + '.';
        jQuery('#showmessage_text').html(text);
        jQuery('#show_event').animate({'right':'10px'});
        setTimeout(function(){jQuery('#show_event').animate({'right':'-410px'},500)}, 5000);

      }

})
});
},

getMinter : function(){
  App.contracts.vote.deployed().then(function(instance) {
    return instance.minter();
}).then(function(result) {
    App.minter = result;
    jQuery('#minter').text("Minter : "+result);
})

},

handleCreateMoney: function(addr,value){

    if(App.currentAccount != App.minter){
      alert("Not Authorised to create money");
      return false;
    }

    var coinInstance;

    App.contracts.vote.deployed().then(function(instance) {
      coinInstance = instance;

      return coinInstance.mint(addr,value);
    }).then( function(result){
      if(result.receipt.status == '0x01')
        alert(value +" unit/units of amount Created successfully to "+addr);
      else
        alert("Creation Failed")
    }).catch( function(err){
      console.log(err.message);
    })

},

// handling the vote
  handleSendMoney: function(addr,value) {

    var coinInstance;
    App.contracts.vote.deployed().then(function(instance) {
      coinInstance = instance;

      return coinInstance.transfer(addr,value);
    }).then( function(result){
      if(result.receipt.status == '0x01')
        alert(value +" unit / units of amount tranfered successfully transfered to "+addr);
      else
        alert("Transfer failed");
    }).catch( function(err){
      console.log(err.message);
    })
  },

  checkBalance : function(){
    App.contracts.vote.deployed().then(function(instance) {
      coinInstance = instance;
    return coinInstance.balances(App.currentAccount);
}).then(function(result) {
  alert("Current Balance : "+result.toNumber());
})


  }
};


$(function() {
  $(window).load(function() {
    App.init();
    console.log('starting app.js');
  });
});
