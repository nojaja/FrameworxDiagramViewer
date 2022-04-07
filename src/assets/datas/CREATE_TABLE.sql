CREATE TABLE ETOM (ID PRIMARY KEY, LEVEL integer, PARENT , NAME , TYPE , ORIGINAL_ID , DESCRIPTION , FUNCTION , BRIEF_DESCRIPTION , DOMAIN , CATEGORY , MATURITY_LEVEL , FRAMEWORX_STATUS );
CREATE TABLE TAM (ID PRIMARY KEY, LEVEL integer, PARENT , NAME , TYPE , ORIGINAL_ID , DESCRIPTION , FUNCTION , BRIEF_DESCRIPTION , DOMAIN , CATEGORY , MATURITY_LEVEL , FRAMEWORX_STATUS );
CREATE TABLE SID_ABE (ID PRIMARY KEY, LEVEL integer, PARENT , NAME , TYPE , ORIGINAL_ID , DESCRIPTION , FUNCTION , BRIEF_DESCRIPTION , DOMAIN , CATEGORY , MATURITY_LEVEL , FRAMEWORX_STATUS );
CREATE TABLE SID_BE (ID PRIMARY KEY, LEVEL integer, PARENT , NAME , TYPE , ORIGINAL_ID , DESCRIPTION , FUNCTION , BRIEF_DESCRIPTION , DOMAIN , CATEGORY , MATURITY_LEVEL , FRAMEWORX_STATUS );
CREATE TABLE ODA_Functional_Blocks (ID PRIMARY KEY, LEVEL integer, PARENT , NAME , TYPE , ORIGINAL_ID , DESCRIPTION , FUNCTION , BRIEF_DESCRIPTION , DOMAIN , CATEGORY , MATURITY_LEVEL , FRAMEWORX_STATUS );
CREATE TABLE End_to_End_Business_Flows (ID PRIMARY KEY, LEVEL integer, PARENT , NAME , TYPE , ORIGINAL_ID , DESCRIPTION , FUNCTION , BRIEF_DESCRIPTION , ASSUMPTIONS , DOMAIN , CATEGORY , MATURITY_LEVEL , FRAMEWORX_STATUS );
CREATE TABLE Legacy_Systems (ID PRIMARY KEY, LEVEL integer, PARENT , NAME , TYPE , FUNCID , CATEGORY , DESCRIPTION , FUNCTION , BRIEF_DESCRIPTION , DOMAIN , MATURITY_LEVEL , DEV_OWNER , OPE_OWNER , SYSTEM_OWNER , SYSTEM_DOCUMENT );
CREATE TABLE Open_APIs (ID PRIMARY KEY, LEVEL integer, PARENT , NAME , TYPE , FUNCID , CATEGORY , DESCRIPTION , FUNCTION , BRIEF_DESCRIPTION , MATURITY_LEVEL , SWAGGER , SPECIFICATION , CONFORMANCE_PROFILE , CTK , SAMPLE_IMPLEMENTATION_CODE , POSTMAN_COLLECTION , RELEASE , VERSION , DOMAIN , LIFECYCLE_STATUS );
CREATE TABLE Functions (ID PRIMARY KEY, LEVEL integer, PARENT , NAME , TYPE , FUNCTION , DOMAIN , CATEGORY , DESCRIPTION , BRIEF_DESCRIPTION , MATURITY_LEVEL , RELEASE , VERSION , Issue );
CREATE TABLE MAPPING (FROM_TABLE,FROM_KEY,TO_TABLE,TO_KEY,SOURCE,MATURITY_LEVEL,MEMO);
CREATE TABLE Product (ID PRIMARY KEY, CATEGORY , BRAND_NAME , PRODUCT_NAME , OWNER );