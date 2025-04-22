# Building KweliVote, an App for Transparent and credible electoral processes Digital Identity

## KweliVote application story for Burundi electoral processes Digital Identity Management

Burundi faces significant challenges in ensuring transparent and credible electoral processes due to the absence of a unique identifier for each citizen. The lack of biometric identity cards has historically led to electoral fraud, such as multiple voting and identity manipulation, undermining trust in the democratic process. With legislative, communal, and hill elections scheduled for 2025 and presidential elections in 2027, the need for a secure and reliable identification system is critical. Additionally, concerns over data security and privacy further complicate efforts to introduce robust identity verification mechanisms. 

What is the envisioned blockchain solution:
1. A blockchain-based biometric identity system can address these challenges by providing a secure, decentralized platform for managing voter identities. 
2. This system would integrate biometric data, such as fingerprints and facial recognition, with a blockchain ledger to create unique, tamper-proof identifiers for each citizen. 
3. Blockchain’s immutable records would prevent identity duplication and manipulation, ensuring fair voter registration and election processes. 
4. Real-time verification at polling stations could streamline voting while maintaining transparency. Furthermore, the system would enhance data security by giving citizens control over their personal information through cryptographic keys.


## The Birth of KweliVote

### Technical Planning Phase

Before starting development, team Dhamana carefully reviewed the KweliVote repository and documentation. This provided a solid foundation for KweliVote, ensuring compliance with technical standards and leveraging proven design patterns.
Together, we identified key requirements for KweliVote:

### User Experience Goals

- Simple, intuitive interface designed specifically for non-tech savvy users
- Quick voter registration and validation to minimize delays in service delivery
- Seamless integration with Core mobile wallet for smart contract signing after ballot counting
- Easy querying of blockchain explorer for auditing.

### Technical Specifications

- Mobile-responsive web application (accessible on tablets and personal devices)
- Secure authentication based on KweliVote's implementation
- Activity verification system to prevent cheating

## Current Development Status

Team Dhamana have set up a vscode environment on WSL: Ubuntu-24.04 and are making remarkable progress with GitHub Copilot agent mode. 

## Key persons involved
|Role | Responsibility|
|-----|---------------|
Registration Clerks | Register new voters at designated centers (Biometric Voter Registration)
IEBC Constituency Election Coordinators (CECs) | Registration of new Registration Clerks, Polling Clerks, Party agents, Domestic observers, International Observers, Polling Station Presiding Officer (PO), Polling Station Deputy Presiding Officer (DPO)|
|Polling Clerks| Verifiy voters biometrically|
|Party Agents|Validate results count|
Observers|Validate results count|
Presiding Officer (PO)| Validate results count|
Deputy Presiding Officer (DPO)| Validate results count|
|Candidates|Candidates do not interact with system, but their names are prepopulated in system. However,the candidates names are crucial in the Results Validation stage. Total votes counted per candidate need to be keyed in after counting and all validator to approve.

## Key persons information needed during registration
|Role | Information needed|
|-----|---------------|
Registration Clerks | firstname, middlename, surname, NationalID,Decentralized Identifier (DID), designated Polling station, createdby, created datetime
IEBC Constituency Election Coordinators (CECs) | firstname, middlename, surname, NationalID,Decentralized Identifier (DID), designated Constituency, createdby, created datetime|
|Polling Clerks| firstname, middlename, surname, NationalID,Decentralized Identifier (DID), designated Polling station, createdby, created datetime|
|Party Agents|firstname, middlename, surname, NationalID,Decentralized Identifier (DID), Political party,designated Polling station, createdby, created datetime|
Observers|firstname, middlename, surname, NationalID,Decentralized Identifier (DID), Political party,Obsever type[local,international],Stake holder being represented [name of country or organization], createdby, created datetime|
Presiding Officer (PO)| firstname, middlename, surname, NationalID,Decentralized Identifier (DID), designated Polling station, createdby, created datetime|
Deputy Presiding Officer (DPO)| firstname, middlename, surname, NationalID,Decentralized Identifier (DID), designated Polling station, createdby, created datetime|
|Candidate| firstname, middlename, surname, NationalID,Decentralized Identifier (DID), candidate type [President,Member of National Assembly (MP),Senator,County Woman Representative,Governor,Member of County Assembly (MCA)], createdby, created datetime|

## Voting Results being validated
1. President
2. Member of National Assembly (MP)
3. Senator
4. County Woman Representative
5. Governor
6. Member of County Assembly (MCA)
This module should clearly show votes counted per candidate.