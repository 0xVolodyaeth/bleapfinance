package com.bleapfinance.depositbackend.DepositContract;

public class DepositContract implements  IDepositContract{


    public String rpcUri;
    public DepositContract(String rpcUri){
       this.rpcUri = rpcUri;
    }

    public String deposit() throws Exception{
        return "";
    }

    public long getBalance() throws Exception{
        return 0;
    }

}
