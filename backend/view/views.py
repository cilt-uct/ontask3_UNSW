from rest_framework_mongoengine import viewsets
from rest_framework_mongoengine.validators import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import list_route, detail_route

from collections import defaultdict
from django.http import JsonResponse
import json

from .serializers import ViewSerializer

from .models import View
# from workflow.models import Workflow
from datasource.models import DataSource


class ViewViewSet(viewsets.ModelViewSet):
    lookup_field = 'id'
    serializer_class = ViewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return View.objects.all()

    def perform_create(self, serializer):
        self.check_object_permissions(self.request, None)

        queryset = View.objects.filter(
            name = self.request.data['name'],
            container = self.request.data['container']
        )
        if queryset.count():
            raise ValidationError('A view with this name already exists')

        data = self.combine_data(self.request.data)

        serializer.save(data=data)

    def perform_update(self, serializer):
        self.check_object_permissions(self.request, self.get_object())

        queryset = View.objects.filter(
            name = self.request.data['name'],
            container = self.get_object()['container'],
            id__ne = self.get_object()['id'] # Check against views other than the one being updated
        )
        if queryset.count():
            raise ValidationError('A view with this name already exists')

        data = self.combine_data(self.request.data)

        serializer.save(data=data)

    def perform_destroy(self, obj):
        self.check_object_permissions(self.request, obj)

        # # Ensure that no workflow is currently using this view
        # queryset = Workflow.objects.filter(
        #     view = self.get_object()['id']
        # )
        # if queryset.count():
        #     raise ValidationError('This view is being used by a workflow')

        obj.delete()

    @detail_route(methods=['get'])
    def retrieve_view(self, request, id=None):
        view = View.objects.get(id=id)
        self.check_object_permissions(self.request, view)

        serializer = ViewSerializer(instance=view)

        datasources = DataSource.objects(container=view.container.id).only('id', 'name', 'fields', 'data')
        # Return only the first row of each datasource's data
        # To be used in guessing the type of a field when trying to add a new column to the view
        for datasource in datasources:
            datasource['data'] = datasource['data'][:1]

        serializer.instance.datasources = datasources
       
        return JsonResponse(serializer.data, safe=False)

    @detail_route(methods=['put'])
    def update_columns(self, request, id=None):
        view = View.objects.get(id=id)
        self.check_object_permissions(self.request, view)

        view.columns = request.data['columns']
        data = self.combine_data(view)

        serializer = ViewSerializer(instance=view, data={'data': data, 'columns': view.columns}, partial=True)

        serializer.is_valid()
        serializer.save()

        return JsonResponse({ 'success': 'true' }, safe=False)

    @detail_route(methods=['post'])
    def delete_column(self, request, id=None):
        view = View.objects.get(id=id)
        self.check_object_permissions(self.request, view)

        columnIndex = self.request.data['columnIndex']
        if columnIndex == 0:
            raise ValidationError('The primary key cannot be deleted')

        del view.columns[columnIndex]
        data = self.combine_data(view)
        serializer = ViewSerializer(instance=view, data={'data': data}, partial=True)

        serializer.is_valid()
        serializer.save()

        return JsonResponse({ 'success': 'true' }, safe=False)

    @list_route(methods=['post'])
    def preview_data(self, request):
        data = self.combine_data(self.request.data)

        # Return the first 10 records of the results
        return JsonResponse(data[:10], safe=False)

    def combine_data(self, view):
        columns = view['columns']
        drop_discrepencies = view['dropDiscrepencies'] if 'dropDiscrepencies' in view else []

        # Get the primary key's datasource data
        primary_datasource_id = columns[0]['datasource']
        primary_datasource = DataSource.objects.get(id=primary_datasource_id)
        primary_field = columns[0]['field']
        primary_key_records = set([record[primary_field] for record in primary_datasource['data']])
    
        # Initialize the defaultdict to hold the results, and seed it with the primary keys
        results = defaultdict(dict)
        results.update((primary_key, {}) for primary_key in primary_key_records)

        # Initialise an object to store the data of each datasource
        # Add the datasource of the primary key to this object
        data = {}
        data[primary_datasource_id] = primary_datasource['data']
                
        primary_key_records_to_drop = set()

        # Create a defaultdict of datasources & the fields used from each datasource
        datasources_used = defaultdict(list)
        for column in columns[1:]: # Skip the primary key
            datasources_used[column['datasource']].append(column)

        for datasource_id, related_columns in datasources_used.items():
            # Retrieve they data for the datasource if needed
            # If the datasource is the same as the primary key datasource, then we already have the data
            if not datasource_id in data:
                datasource = DataSource.objects.get(id=datasource_id)
                data[datasource_id] = datasource['data']
        
            # Create a defaultdict of matching fields used from this datasource
            matching_fields_used = defaultdict(list)
            for column in related_columns:
                matching_fields_used[column['matching']].append(column)

            # Iterate over the grouped matching fields
            for matching_field, matched_columns in matching_fields_used.items():
                matching_field_records = set([record[matching_field] for record in data[datasource_id]])
                
                # Identify any discrepencies between this matching field and the primary key
                unique_in_matching = matching_field_records - primary_key_records
                unique_in_primary = primary_key_records - matching_field_records

                should_drop_discrepency = next((discrepency for discrepency in drop_discrepencies if discrepency['datasource'] == datasource_id and discrepency['matching'] == matching_field), {})
                if 'dropPrimary' in should_drop_discrepency and should_drop_discrepency['dropPrimary']:
                    # If primary discrepencies should be dropped, and some are detected, then add them to the list for removal later in the function
                    primary_key_records_to_drop.update(unique_in_primary)

                for record in data[datasource_id]:
                    matching_value = record[matching_field]

                    for column in matched_columns:
                        field = column['label'] if ('label' in column and column['label'] is not None) else column['field']
                        value = record[column['field']]

                        # If matching field discrepencies should be dropped, and this particular record is one such discrepency
                        # Then do not add this record to the results dict
                        if ('dropMatching' in should_drop_discrepency and should_drop_discrepency['dropMatching']) and matching_value in unique_in_matching:
                            continue
                        # Otherwise, do add this record to the results dict
                        results[matching_value][field] = value  

        # Remove any stored primary discrepencies
        # There would only be values to remove if should_drop_discrepency was true for these values
        for primary_key in primary_key_records_to_drop:
            if primary_key in results:
                results.pop(primary_key)

        # Convert the results into a structure that can be consumed by the data table
        response = []
        for primary_key, fields in results.items():
            response.append({ primary_field: primary_key, **fields })

        return response
