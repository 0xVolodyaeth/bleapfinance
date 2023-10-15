package com.bleapfinance.depositbackend.DepositContract;

public interface IDepositContract {
    public String deposit() throws Exception;

    public long getBalance() throws Exception;
}
