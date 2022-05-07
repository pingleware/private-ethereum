/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE DATABASE IF NOT EXISTS `private-ethereum` /*!40100 DEFAULT CHARACTER SET latin1 */;
USE `private-ethereum`;

CREATE TABLE IF NOT EXISTS `accounts` (
  `address` varchar(256) NOT NULL,
  `transactionCount` bigint(20) DEFAULT NULL,
  `code` longtext,
  PRIMARY KEY (`address`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


CREATE TABLE IF NOT EXISTS `amended_tokens` (
  `address` varchar(256) NOT NULL,
  `symbol` varchar(256) DEFAULT NULL,
  `name` varchar(256) DEFAULT NULL,
  `decimals` varchar(256) DEFAULT NULL,
  PRIMARY KEY (`address`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='Token amended with data from https://github.com/blockchain-etl/ethereum-etl-airflow/blob/master/dags/resources/stages/seed/data/token_amendments.csv Deduplicate first since the tokens table might have duplicate entries due to CREATE2 https://medium.com/@jason.carver/defend-against-wild-magic-in-the-next-ethereum-upgrade-b008247839d2';

/*!40000 ALTER TABLE `amended_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `amended_tokens` ENABLE KEYS */;

CREATE TABLE IF NOT EXISTS `balances` (
  `address` varchar(256) NOT NULL,
  `eth_balance` double DEFAULT NULL,
  PRIMARY KEY (`address`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='This table contains Ether balances of all addresses, updated daily.';


CREATE TABLE IF NOT EXISTS `blocks` (
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `number` int(11) DEFAULT NULL,
  `hash` varchar(256) NOT NULL,
  `parent_hash` varchar(256) DEFAULT NULL,
  `nonce` varchar(256) DEFAULT NULL,
  `sha3_uncles` varchar(256) DEFAULT NULL,
  `logs_bloom` varchar(256) DEFAULT NULL,
  `transactions_root` varchar(256) DEFAULT NULL,
  `state_root` varchar(256) DEFAULT NULL,
  `receipts_root` varchar(256) DEFAULT NULL,
  `miner` varchar(256) DEFAULT NULL,
  `difficulty` double DEFAULT NULL,
  `total_difficulty` double DEFAULT NULL,
  `size` int(11) DEFAULT NULL,
  `extra_data` varchar(256) DEFAULT NULL,
  `gas_limit` int(11) DEFAULT NULL,
  `gas_used` int(11) DEFAULT NULL,
  `transaction_count` int(11) DEFAULT NULL,
  PRIMARY KEY (`hash`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='The Ethereum blockchain is composed of a series of blocks. This table contains a set of all blocks in the blockchain and their attributes.';


CREATE TABLE IF NOT EXISTS `contracts` (
  `address` varchar(256) NOT NULL,
  `bytecode` varchar(256) DEFAULT NULL,
  `function_sighashes` varchar(256) DEFAULT NULL,
  `is_erc20` tinyint(1) DEFAULT NULL,
  `is_erc721` tinyint(1) DEFAULT NULL,
  `block_timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `block_number` int(11) DEFAULT NULL,
  `block_hash` varchar(256) DEFAULT NULL,
  PRIMARY KEY (`address`),
  KEY `block_hash` (`block_hash`),
  CONSTRAINT `contracts_ibfk_1` FOREIGN KEY (`block_hash`) REFERENCES `blocks` (`hash`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='Some transactions create smart contracts from their input bytes, and this smart contract is stored at a particular 20-byte address.\r\nThis table contains a subset of Ethereum addresses that contain contract byte-code, as well as some basic analysis of that byte-code.';

/*!40000 ALTER TABLE `contracts` DISABLE KEYS */;
/*!40000 ALTER TABLE `contracts` ENABLE KEYS */;

CREATE TABLE IF NOT EXISTS `logs` (
  `log_index` int(11) NOT NULL,
  `transaction_hash` varchar(256) NOT NULL,
  `transaction_index` int(11) DEFAULT NULL,
  `address` varchar(256) DEFAULT NULL,
  `data` varchar(256) DEFAULT NULL,
  `topics` varchar(256) DEFAULT NULL,
  `block_timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `block_number` int(11) DEFAULT NULL,
  `block_hash` varchar(256) DEFAULT NULL,
  PRIMARY KEY (`transaction_hash`,`log_index`),
  KEY `block_hash` (`block_hash`),
  CONSTRAINT `logs_ibfk_1` FOREIGN KEY (`transaction_hash`) REFERENCES `transactions` (`hash`),
  CONSTRAINT `logs_ibfk_2` FOREIGN KEY (`block_hash`) REFERENCES `blocks` (`hash`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='Similar to the token_transfers table, the logs table contains data for smart contract events. However, it contains all log data, not only ERC20 token transfers.\r\nThis table is generally useful for reporting on any logged event type on the Ethereum blockchain.';

/*!40000 ALTER TABLE `logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `logs` ENABLE KEYS */;

CREATE TABLE IF NOT EXISTS `tokens` (
  `address` varchar(256) NOT NULL COMMENT 'This is the Logical composite key',
  `symbol` varchar(256) DEFAULT NULL,
  `name` varchar(256) DEFAULT NULL,
  `decimals` varchar(256) DEFAULT NULL,
  `total_supply` varchar(256) DEFAULT NULL,
  `block_timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `block_number` int(11) DEFAULT NULL,
  `block_hash` varchar(256) DEFAULT NULL,
  PRIMARY KEY (`address`),
  KEY `block_hash` (`block_hash`),
  CONSTRAINT `tokens_ibfk_1` FOREIGN KEY (`block_hash`) REFERENCES `blocks` (`hash`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='List of Tokens';

/*!40000 ALTER TABLE `tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `tokens` ENABLE KEYS */;

CREATE TABLE IF NOT EXISTS `token_transfers` (
  `token_address` varchar(256) DEFAULT NULL,
  `from_address` varchar(256) DEFAULT NULL,
  `to_address` varchar(256) DEFAULT NULL,
  `value` varchar(256) DEFAULT NULL,
  `transaction_hash` varchar(256) NOT NULL,
  `log_index` int(11) NOT NULL,
  `block_timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `block_number` int(11) DEFAULT NULL,
  `block_hash` varchar(256) DEFAULT NULL,
  PRIMARY KEY (`transaction_hash`,`log_index`),
  KEY `block_hash` (`block_hash`),
  KEY `token_address` (`token_address`),
  KEY `from_address` (`from_address`),
  KEY `to_address` (`to_address`),
  CONSTRAINT `token_transfers_ibfk_1` FOREIGN KEY (`transaction_hash`) REFERENCES `transactions` (`hash`),
  CONSTRAINT `token_transfers_ibfk_2` FOREIGN KEY (`block_hash`) REFERENCES `blocks` (`hash`),
  CONSTRAINT `token_transfers_ibfk_3` FOREIGN KEY (`token_address`) REFERENCES `tokens` (`address`),
  CONSTRAINT `token_transfers_ibfk_4` FOREIGN KEY (`token_address`) REFERENCES `amended_tokens` (`address`),
  CONSTRAINT `token_transfers_ibfk_5` FOREIGN KEY (`from_address`) REFERENCES `balances` (`address`),
  CONSTRAINT `token_transfers_ibfk_6` FOREIGN KEY (`to_address`) REFERENCES `balances` (`address`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='The most popular type of transaction on the Ethereum blockchain invokes a contract of type ERC20 to perform a transfer operation, moving some number of tokens from one 20-byte address to another 20-byte address. This table contains the subset of those transactions and has further processed and denormalized the data to make it easier to consume for analysis of token transfer events.';

/*!40000 ALTER TABLE `token_transfers` DISABLE KEYS */;
/*!40000 ALTER TABLE `token_transfers` ENABLE KEYS */;

CREATE TABLE IF NOT EXISTS `traces` (
  `transaction_hash` varchar(256) DEFAULT NULL,
  `transaction_index` int(11) DEFAULT NULL,
  `from_address` varchar(256) DEFAULT NULL,
  `to_address` varchar(256) DEFAULT NULL,
  `value` double DEFAULT NULL,
  `input` varchar(256) DEFAULT NULL,
  `output` varchar(256) DEFAULT NULL,
  `trace_type` varchar(256) DEFAULT NULL,
  `call_type` varchar(256) DEFAULT NULL,
  `reward_type` varchar(256) DEFAULT NULL,
  `gas` int(11) DEFAULT NULL,
  `gas_used` int(11) DEFAULT NULL,
  `subtraces` int(11) DEFAULT NULL,
  `trace_address` varchar(256) DEFAULT NULL,
  `error` varchar(256) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `block_timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `block_number` int(11) DEFAULT NULL,
  `block_hash` varchar(256) DEFAULT NULL,
  `trace_id` varchar(256) NOT NULL,
  PRIMARY KEY (`trace_id`),
  KEY `block_hash` (`block_hash`),
  KEY `transaction_hash` (`transaction_hash`),
  KEY `traces_ibfk_2` (`from_address`),
  KEY `to_address` (`to_address`),
  CONSTRAINT `traces_ibfk_1` FOREIGN KEY (`block_hash`) REFERENCES `blocks` (`hash`),
  CONSTRAINT `traces_ibfk_2` FOREIGN KEY (`from_address`) REFERENCES `balances` (`address`),
  CONSTRAINT `traces_ibfk_3` FOREIGN KEY (`to_address`) REFERENCES `balances` (`address`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='Traces exported using Parity trace module https://wiki.parity.io/JSONRPC-trace-module.';

/*!40000 ALTER TABLE `traces` DISABLE KEYS */;
/*!40000 ALTER TABLE `traces` ENABLE KEYS */;

CREATE TABLE IF NOT EXISTS `transactions` (
  `hash` varchar(256) NOT NULL,
  `nonce` int(11) DEFAULT NULL,
  `transaction_index` int(11) DEFAULT NULL,
  `from_address` varchar(256) DEFAULT NULL,
  `to_address` varchar(256) DEFAULT NULL,
  `value` double DEFAULT NULL,
  `gas` int(11) DEFAULT NULL,
  `gas_price` int(11) DEFAULT NULL,
  `input` varchar(256) DEFAULT NULL,
  `receipt_cumulative_gas_used` int(11) DEFAULT NULL,
  `receipt_gas_used` int(11) DEFAULT NULL,
  `receipt_contract_address` varchar(256) DEFAULT NULL,
  `receipt_root` varchar(256) DEFAULT NULL,
  `receipt_status` int(11) DEFAULT NULL,
  `block_timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `block_number` int(11) DEFAULT NULL,
  `block_hash` varchar(256) DEFAULT NULL,
  PRIMARY KEY (`hash`),
  KEY `block_hash` (`block_hash`),
  KEY `from_address` (`from_address`),
  KEY `to_address` (`to_address`),
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`block_hash`) REFERENCES `blocks` (`hash`),
  CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`from_address`) REFERENCES `balances` (`address`),
  CONSTRAINT `transactions_ibfk_3` FOREIGN KEY (`to_address`) REFERENCES `balances` (`address`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='Each block in the blockchain is composed of zero or more transactions. Each transaction has a source address, a target address, an amount of Ether transferred, and an array of input bytes.\r\nThis table contains a set of all transactions from all blocks, and contains a block identifier to get associated block-specific information associated with each TRANSACTION.';


/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
