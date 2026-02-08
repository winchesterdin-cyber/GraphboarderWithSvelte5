// Core GraphQL Types
export type GraphQLKind =
	| 'SCALAR'
	| 'OBJECT'
	| 'INTERFACE'
	| 'UNION'
	| 'ENUM'
	| 'INPUT_OBJECT'
	| 'LIST'
	| 'NON_NULL';

export type QMSType = 'query' | 'mutation' | 'subscription';

export interface GraphQLNamedType {
	name: string;
	kind: GraphQLKind;
}

export interface GraphQLType {
	name?: string;
	kind?: GraphQLKind;
	type?: GraphQLType;
	ofType?: GraphQLType;
}

export interface GraphQLField {
	name: string;
	description?: string;
	args?: GraphQLArgument[];
	type: GraphQLType;
	isDeprecated?: boolean;
	deprecationReason?: string;
}

export interface GraphQLArgument extends Partial<DerivedData> {
	name: string;
	description?: string;
	type: GraphQLType;
	defaultValue?: unknown;
}

export interface GraphQLInputField {
	name: string;
	description?: string;
	type: GraphQLType;
	defaultValue?: unknown;
}

export interface GraphQLEnumValue {
	name: string;
	description?: string;
	isDeprecated?: boolean;
	deprecationReason?: string;
}

// Derived Data Types (prefixed with dd_)
export interface DerivedData {
	dd_kindsArray: GraphQLKind[];
	dd_namesArray: string[];
	dd_rootName: string;
	dd_displayName: string;
	dd_relatedRoot: RootType | string; // Can be string for circular reference avoidance
	dd_kindEl?: GraphQLKind;
	dd_kindEl_NON_NULL: boolean;
	dd_kindList: boolean;
	dd_kindList_NON_NULL: boolean;
	dd_NON_NULL: boolean;
	dd_displayInterface?: DisplayInterface;
	dd_isArg: boolean;
	dd_relatedRoot_inputFields_allScalar?: boolean;
	dd_canExpand: boolean;
	dd_shouldExpand: boolean;
	dd_isQMSField: boolean;
	dd_castType: string;
	dd_derivedTypeBorrowed: string;
	dd_baseFilterOperators?: string[];
	dd_nonBaseFilterOperators?: string[];
	dd_isRootArg?: boolean;
	dd_isPaginationArg?: boolean;
	dd_standsFor?: string;
	dd_paginationArgs?: FieldWithDerivedData[];
	dd_paginationType?: string;
	dd_StrForFuseComparison: string;
}

export interface RootType extends GraphQLNamedType, Partial<DerivedData> {
	fields?: FieldWithDerivedData[];
	inputFields?: InputFieldWithDerivedData[];
	enumValues?: GraphQLEnumValue[];
	interfaces?: GraphQLNamedType[];
	possibleTypes?: GraphQLNamedType[];
	description?: string;
}

export interface FieldWithDerivedData extends GraphQLField, DerivedData {}

export interface InputFieldWithDerivedData extends GraphQLInputField, DerivedData {}

// Schema Data Types
export interface SchemaDataValue {
	rootTypes: RootType[];
	queryFields: FieldWithDerivedData[];
	mutationFields: FieldWithDerivedData[];
	subscriptionFields: FieldWithDerivedData[];
	schema: { types?: any[]; [key: string]: any };
	isReady: boolean;
}

export type SchemaData = SchemaDataStore;

export interface SchemaDataStore {
	subscribe: (run: (value: SchemaDataValue) => void) => () => void;
	set: (value: SchemaDataValue) => void;
	update: (updater: (value: SchemaDataValue) => SchemaDataValue) => void;
	set_schema: (schema: unknown) => void;
	set_rootTypes: (
		withDerivedData: boolean,
		set_storeVal: boolean,
		endpointInfo: EndpointInfoStore
	) => RootType[];
	set_rootTypes_DerivedData: () => void;
	set_QMSFields: (
		withDerivedData: boolean,
		set_storeVal: boolean,
		QMS: string[],
		endpointInfo: EndpointInfoStore
	) => Record<string, unknown>;
	set_fields: (endpointInfo: EndpointInfoStore) => void;
	get_rootType: (
		rootTypes: RootType[] | null,
		rootTypeName: string,
		schemaData: SchemaDataStore
	) => RootType | undefined;
	get_QMS_Field: (
		qmsName: string,
		qmsType: QMSType,
		schemaData: SchemaDataStore
	) => FieldWithDerivedData | undefined;
}

// Display Interface Types
export type DisplayInterface =
	| 'text'
	| 'number'
	| 'datetime-local'
	| 'geo'
	| 'boolean'
	| 'ENUM'
	| 'codeeditor'
	| null;

export interface TypeExtraData {
	displayInterface: DisplayInterface;
	defaultValue: unknown;
	use_transformerREVERSE: (val: unknown) => unknown;
	use_transformer: (val: unknown) => unknown;
}

// Pagination Types
export type PaginationStand =
	| 'limit'
	| 'offset'
	| 'first'
	| 'last'
	| 'after'
	| 'before'
	| 'from'
	| 'page';

export interface PaginationState {
	[key: string]: unknown;
}

export interface PaginationTypeInfo {
	name: string;
	check: (standsForArray: string[]) => boolean;
	get_rowLimitingArgNames?: (paginationArgs: FieldWithDerivedData[]) => (string | undefined)[];
	get_dependencyColsData?: (
		qmsName: string,
		qmsType: QMSType,
		schemaData: SchemaDataStore
	) => unknown[];
	get_initialState: (paginationArgs: FieldWithDerivedData[]) => PaginationState;
	get_nextPageState: (
		currentState: PaginationState,
		paginationArgs: FieldWithDerivedData[],
		returnedDataBatch_last?: unknown,
		qmsName?: string,
		qmsType?: QMSType
	) => PaginationState;
	get_prevPageState: (
		currentState: PaginationState,
		paginationArgs: FieldWithDerivedData[],
		returnedDataBatch_last?: unknown,
		qmsName?: string,
		qmsType?: QMSType
	) => PaginationState;
	get_defaultPaginationStateForDynamic: (
		currentState: PaginationState,
		paginationArgs: FieldWithDerivedData[]
	) => PaginationState;
	isFirstPage?: (
		paginationStateStore: PaginationStateStore,
		paginationArgs: FieldWithDerivedData[]
	) => boolean;
}

// Column Data Types
export interface StepsOfFieldsObject {
	[key: string]: StepsOfFieldsObject | string;
}

export interface TableColumnData {
	title: string;
	stepsOfFields?: string[];
	stepsOfFieldsOBJ?: StepsOfFieldsObject;
	stepsOfFieldsForDataGetter?: string[];
}

// Active Argument Types
export interface ActiveArgumentData extends Partial<FieldWithDerivedData> {
	id: string;
	stepsOfFields: string[];
	stepsOfFieldsStringified: string;
	inUse?: boolean;
	chd_rawValue?: unknown;
	chd_dispatchValue?: unknown;
	chd_chosen?: boolean;
	gqlArgObj?: Record<string, unknown>;
	canRunQuery?: boolean;
	not?: boolean;
	inputFields?: InputFieldWithDerivedData[];
	enumValues?: GraphQLEnumValue[];
	selectedRowsColValues?: Record<string, unknown>[];
	chosenDisplayInterface?: DisplayInterface;
	defaultValue?: unknown;
	[key: string]: any;
}

export interface ContainerData extends ActiveArgumentData {
	operator: 'bonded' | 'list' | '_and' | '_or' | '_not' | 'and' | 'or' | 'not' | '~spread~';
	items: ContainerItem[];
	isMain?: boolean;
	stepsOfNodes?: unknown[];
}

export interface ContainerItem {
	id: string;
}

export interface ActiveArgumentGroup {
	originType: FieldWithDerivedData;
	group_name: string;
	group_isRoot: boolean;
	group_hasAllArgs?: boolean;
	group_args: ActiveArgumentData[];
	group_argsNode?: Record<string, ContainerData>;
	group_gqlArgObj?: Record<string, unknown>;
	group_gqlArgObj_string?: string;
	group_canRunQuery?: boolean;
	dd_kindList?: boolean;
}

// Endpoint Configuration Types
export interface RowsLocationPossibility {
	get_Val: (qmsInfo: FieldWithDerivedData, schemaData: SchemaDataStore) => string[] | null;
	check: (qmsInfo: FieldWithDerivedData, schemaData: SchemaDataStore) => boolean;
}

export interface IdFieldPossibility {
	get_Val: (
		qmsInfo: FieldWithDerivedData,
		schemaData: SchemaDataStore
	) => FieldWithDerivedData | undefined;
	check: (
		qmsInfo: FieldWithDerivedData,
		schemaData: SchemaDataStore
	) => boolean | FieldWithDerivedData | undefined;
}

export interface TypeExtraDataPossibility {
	get_Val: (typeInfo?: FieldWithDerivedData) => TypeExtraData;
	check: (
		dd_rootName: string,
		dd_displayName: string,
		typeObj: Partial<FieldWithDerivedData>
	) => boolean | null;
}

export interface IdDecoderPossibility {
	get_Val: (qmsInfo: FieldWithDerivedData, schemaData: SchemaDataStore, id: string) => string;
	check: (qmsInfo: FieldWithDerivedData, schemaData: SchemaDataStore) => boolean;
}

export interface EndpointConfiguration {
	url?: string;
	description?: string;
	id?: string;
	isMaintained?: boolean;
	headers?: Record<string, string>;
	rowsLocationPossibilities?: RowsLocationPossibility[];
	rowCountLocationPossibilities?: RowsLocationPossibility[];
	relayPageInfoFieldsPossibleNames?: Record<string, string[]>;
	relayCursorPossibleNames?: Record<string, string[]>;
	paginationArgsPossibleNames?: Record<string, string[]>;
	idFieldPossibilities?: IdFieldPossibility[];
	typesExtraDataPossibilities?: TypeExtraDataPossibility[];
	idDecoderPossibilities?: IdDecoderPossibility[];
	returningColumnsPossibleLocationsInMutations?: string[][];
	returningColumnsPossibleLocationsInQueriesPerRow?: string[][];
	inputColumnsPossibleLocationsInArg?: string[][];
	pageInfoFieldsLocation?: string[];
	tableNamePossibilities?: {
		get_Val: (qmsInfo: FieldWithDerivedData, schemaData: SchemaDataStore) => string | null;
		check: (qmsInfo: FieldWithDerivedData, schemaData: SchemaDataStore) => boolean;
	}[];
	qmsNameForObjectivePossibilities?: {
		get_Val: (params: QMSObjectiveParams) => string | null;
		check: (params: QMSObjectiveParams) => boolean;
	}[];
}

export interface QMSObjectiveParams {
	QMS_info: FieldWithDerivedData;
	schemaData: SchemaDataStore;
	thisContext: EndpointInfoStore;
	tableName: string;
	qmsObjective: string;
}

// Store Types
export interface EndpointInfoStore {
	subscribe: (run: (value: EndpointConfiguration) => void) => () => void;
	set: (value: EndpointConfiguration) => void;
	update: (updater: (value: EndpointConfiguration) => EndpointConfiguration) => void;
	get_thisContext: () => EndpointInfoStore;
	smartSet: (newEndpoint: EndpointConfiguration) => void;
	get_inputFieldsContainerLocation: (
		qmsInfo: FieldWithDerivedData,
		schemaData: SchemaDataStore
	) => string[];
	get_rowsLocation: (qmsInfo: FieldWithDerivedData, schemaData: SchemaDataStore) => string[];
	get_rowCountLocation: (
		qmsInfo: FieldWithDerivedData,
		schemaData: SchemaDataStore
	) => string[] | null;
	get_idField: (
		qmsInfo: FieldWithDerivedData,
		schemaData: SchemaDataStore
	) => FieldWithDerivedData | null;
	get_typeExtraData: (
		typeInfo: Partial<FieldWithDerivedData>,
		choosenDisplayInterface?: DisplayInterface
	) => TypeExtraData | null;
	get_tableName: (qmsInfo: FieldWithDerivedData, schemaData: SchemaDataStore) => string | null;
	get_qmsNameForObjective: (
		qmsInfo: FieldWithDerivedData,
		schemaData: SchemaDataStore,
		qmsObjective: string
	) => string | null;
	get_decodedId: (
		qmsInfo: FieldWithDerivedData,
		schemaData: SchemaDataStore,
		id: string
	) => string | null;
	get_relayPageInfoFieldsNames: (
		currentQmsInfo: FieldWithDerivedData,
		pageInfoFieldsLocation: string[],
		schemaData: SchemaDataStore
	) => Record<string, string> | null;
	get_relayCursorFieldName: (
		currentQmsInfo: FieldWithDerivedData,
		rowsLocation: string[],
		schemaData: SchemaDataStore
	) => Record<string, string> | null;
}

export interface ActiveArgumentsDataGroupedStore {
	subscribe: (run: (value: ActiveArgumentGroup[]) => void) => () => void;
	set: (value: ActiveArgumentGroup[]) => void;
	update: (updater: (value: ActiveArgumentGroup[]) => ActiveArgumentGroup[]) => void;
	set_groups: (
		qmsInfo: FieldWithDerivedData,
		schemaData: SchemaDataStore,
		qmsArguments: Record<string, unknown> | null,
		endpointInfo: EndpointInfoStore
	) => void;
	update_groups: (groupNewData: ActiveArgumentGroup) => void;
	update_activeArgument: (activeArgumentData: ActiveArgumentData, groupName: string) => void;
	delete_activeArgument: (activeArgumentData: ActiveArgumentData, groupName: string) => void;
	get_activeArgument: (
		stepsOfFields: string[],
		groupName?: string
	) => ActiveArgumentData | undefined;
	add_activeArgument: (
		newArgumentOrContainerData: ActiveArgumentData | ContainerData,
		groupName: string,
		parentContainerId: string | null,
		endpointInfo: EndpointInfoStore
	) => void;
}

export interface TableColsDataStore {
	subscribe: (run: (value: TableColumnData[]) => void) => () => void;
	set: (value: TableColumnData[]) => void;
	update: (updater: (value: TableColumnData[]) => TableColumnData[]) => void;
	addColumns: (newColsData: TableColumnData[]) => void;
	addColumn: (newColData: TableColumnData) => void;
	removeColumn: (colToRemoveData_title: string) => void;
}

export interface PaginationStateStore {
	subscribe: (run: (value: PaginationState) => void) => () => void;
	set: (value: PaginationState) => void;
	update: (updater: (value: PaginationState) => PaginationState) => void;
	nextPage: (returnedDataBatch_last: unknown, qmsName: string, qmsType: QMSType) => void;
	prevPage: (returnedDataBatch_last: unknown, qmsName: string, qmsType: QMSType) => void;
	resetToDefault: () => void;
}

// GQL Argument Object Types
export interface GQLArgObj {
	arg_gqlArgObj: Record<string, unknown>;
	arg_canRunQuery: boolean;
	gqlArgObj: Record<string, unknown>;
	canRunQuery: boolean;
	note: string;
}

export interface FinalGQLArgObj {
	finalGqlArgObj: Record<string, unknown>;
	final_canRunQuery: boolean;
}

// Fields Grouped Types
export interface FieldsGrouped {
	scalarFields: FieldWithDerivedData[];
	non_scalarFields: FieldWithDerivedData[];
	enumFields: (RootType & FieldWithDerivedData)[];
}

// Available Endpoints
export interface AvailableEndpoint extends EndpointConfiguration {
	id: string;
	url: string;
	description?: string;
	isMaintained?: boolean;
	isFavorite?: boolean;
	headers?: Record<string, string>;
	namings?: Record<string, string>;
	authToken?: string;
	pageInfoFieldsLocation?: string[];
	displayNamePossibilitiesForCreateItem?: any[];
}

// Context Types
export interface QMSWraperContext {
	idColName: string | null;
	returningColumnsLocationQMS_Info: FieldWithDerivedData | undefined;
	rowsLocation: string[];
	returningColumnsLocation: string[];
	QMS_info: FieldWithDerivedData | undefined;
	QMSType: QMSType;
	QMSName: string;
	activeArgumentsDataGrouped_Store: ActiveArgumentsDataGroupedStore;
	tableColsData_Store: TableColsDataStore;
	finalGqlArgObj_Store: any;
	QMS_bodyPart_StoreDerived: any;
	QMS_bodyPart_StoreDerived_rowsCount: any;
	QMS_bodyPartsUnifier_StoreDerived: any;
	paginationOptions: any;
	paginationState: PaginationStateStore;
	paginationState_derived: any;
	mergedChildren_finalGqlArgObj_Store: any;
	mergedChildren_QMSWraperCtxData_Store: any;
	mergedChildren_controlPanel_Store: any;
	QMSFieldToQMSGetMany_Store: any;
	extraInfo: Record<string, unknown>;
}

export interface QMSMainWraperContext {
	endpointInfo: EndpointInfoStore;
	schemaData: SchemaDataStore;
	urqlCoreClient: any;
}
