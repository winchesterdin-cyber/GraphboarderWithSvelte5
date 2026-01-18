<script lang="ts">
	import { getDataGivenStepsOfFields } from '$lib/utils/usefulFunctions';
	import { getContext } from 'svelte';

	interface Props {
		prefix?: string;
		QMS_bodyPart_StoreDerived: any;
		QMS_info: any;
	}

	let { prefix = '', QMS_bodyPart_StoreDerived, QMS_info }: Props = $props();

	let QMSMainWraperContext: any = getContext(`${prefix}QMSMainWraperContext`);
	const endpointInfo = QMSMainWraperContext?.endpointInfo;
	const urqlCoreClient = QMSMainWraperContext?.urqlCoreClient;
	const schemaData = QMSMainWraperContext?.schemaData;

	let countValue = $state('?');
	let queryData = $state<any>();

	const runQuery = (queryBody: string) => {
		$urqlCoreClient
			.query(queryBody)
			.toPromise()
			.then((result: any) => {
				let error = null;
				let data = null;

				if (result.error) {
					error = result.error.message;
				}
				if (result.data) {
					data = result.data;
				}
				queryData = { error, data };
			});
	};

	$effect(() => {
		if (queryData?.data) {
			countValue = getDataGivenStepsOfFields(
				null,
				queryData.data,
				endpointInfo.get_rowCountLocation(QMS_info, schemaData)
			);
		} else {
			countValue = '?';
		}
	});

	$effect(() => {
		const QMS_body = $QMS_bodyPart_StoreDerived;
		if (QMS_body && QMS_body !== '') {
			runQuery(
				`query {
				${QMS_body}
		}`
			);
		}
	});
</script>

<div>
	{countValue}
</div>
