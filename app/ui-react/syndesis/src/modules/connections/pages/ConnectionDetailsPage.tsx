import {
  IValidationResult,
  WithConnection,
  WithConnectionHelpers,
} from '@syndesis/api';
import { Connection } from '@syndesis/models';
import {
  Breadcrumb,
  ConnectionDetailsForm,
  ConnectionDetailsHeader,
  Loader,
} from '@syndesis/ui';
import { WithLoader, WithRouteData } from '@syndesis/utils';
import * as React from 'react';
import { Translation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AppContext } from '../../../app';
import i18n from '../../../i18n';
import { ApiError } from '../../../shared';
import resolvers from '../../resolvers';
import { WithConfigurationForm } from '../shared/WithConnectorCreationForm';
import './ConnectionDetailsPage.css';

export interface IConnectionDetailsRouteParams {
  connectionId: string;
}

export interface IConnectionDetailsRouteState {
  connection?: Connection;
}

export interface IConnectionDetailsPageState {
  isWorking: boolean;
}

export class ConnectionDetailsPage extends React.Component<
  {},
  IConnectionDetailsPageState
> {
  public constructor(props: {}) {
    super(props);
    this.state = { isWorking: false };
  }

  public getUsedByMessage(connection: Connection): string {
    // TODO: Schema is currently wrong as it has 'uses' as an OptionalInt. Remove cast when schema is fixed.
    const numUsedBy = connection.uses as number;

    if (numUsedBy === 1) {
      return i18n.t('connections:usedByOne');
    }

    return i18n.t('connections:usedByMulti', { count: numUsedBy });
  }

  public render() {
    return (
      <AppContext.Consumer>
        {({ pushNotification }) => {
          return (
            <WithRouteData<
              IConnectionDetailsRouteParams,
              IConnectionDetailsRouteState
            >>
              {({ connectionId }, { connection }, { history }) => (
                <Translation ns={['connections', 'shared']}>
                  {t => (
                    <WithConnectionHelpers>
                      {({ updateConnection, saveConnection, validateName }) => {
                        return (
                          <WithConnection
                            id={connectionId}
                            initialValue={connection}
                          >
                            {({ data, hasData, error }) => {
                              const save = async ({
                                name,
                                description,
                                configuredProperties,
                              }: {
                                name?: string;
                                description?: string;
                                configuredProperties?: {
                                  [key: string]: string;
                                };
                              }): Promise<boolean> => {
                                const updatedConnection = updateConnection(
                                  data,
                                  name,
                                  description,
                                  configuredProperties
                                );
                                try {
                                  await saveConnection(updatedConnection);
                                  history.push(
                                    resolvers.connections.connection.details({
                                      connection: updatedConnection,
                                    })
                                  );
                                  return true;
                                } catch (error) {
                                  pushNotification(
                                    t('errorSavingConnection'),
                                    'error'
                                  );
                                  return false;
                                }
                              };

                              const saveDescription = async (
                                description: string
                              ): Promise<boolean> => {
                                this.setState({ isWorking: true });
                                const saved = save({ description });
                                this.setState({ isWorking: false });
                                return saved;
                              };

                              const saveName = async (
                                name: string
                              ): Promise<boolean> => {
                                this.setState({ isWorking: true });
                                const validName = doValidateName(name);

                                if (validName) {
                                  const saved = save({ name });
                                  this.setState({ isWorking: false });
                                  return saved;
                                }

                                return false;
                              };

                              const saveConnector = async (
                                configuredProperties: { [key: string]: string },
                                actions: any
                              ): Promise<void> => {
                                await save({ configuredProperties });
                                actions.setSubmitting(false);
                              };

                              /**
                               * Backend validation only occurs when save has been called.
                               * @param proposedName the name to validate
                               */
                              const doValidateName = async (
                                proposedName: string
                              ): Promise<true | string> => {
                                // make sure name has a value
                                if (proposedName === '') {
                                  const msg = t('shared:requiredFieldMessage');
                                  return msg
                                    ? msg
                                    : 'shared:requiredFieldMessage';
                                }

                                // only call server validation if save is running
                                if (this.state.isWorking) {
                                  try {
                                    const response: IValidationResult = await validateName(
                                      connection!,
                                      proposedName
                                    );

                                    if (!response.isError) {
                                      return true;
                                    }

                                    if (response.error === 'UniqueProperty') {
                                      const msg = t('duplicateNameError');
                                      return msg
                                        ? msg
                                        : 'connections:duplicateNameError';
                                    }

                                    return response.message
                                      ? response.message
                                      : t('errorValidatingName')
                                      ? t('errorValidatingName')!
                                      : 'connections:errorValidatingName'; // return missing i18n key
                                  } catch (error) {
                                    pushNotification(
                                      t('errorValidatingName'),
                                      'error'
                                    );
                                    return true;
                                  } finally {
                                    this.setState({ isWorking: false });
                                  }
                                }

                                return true;
                              };

                              const cancelEditing = () => {
                                // TODO: this needs to reset AutoForm
                                history.push(
                                  resolvers.connections.connection.details({
                                    connection: connection!,
                                  })
                                );
                              };
                              return (
                                <WithLoader
                                  error={error}
                                  loading={!hasData}
                                  loaderChildren={<Loader />}
                                  errorChildren={<ApiError />}
                                >
                                  {() => {
                                    return (
                                      <WithConfigurationForm
                                        connector={data.connector!}
                                        initialValue={data.configuredProperties}
                                        onSave={saveConnector}
                                      >
                                        {({
                                          fields,
                                          handleSubmit,
                                          validationResults,
                                          isSubmitting,
                                          isValid,
                                          isValidating,
                                          validateForm,
                                        }) => (
                                          <>
                                            <Breadcrumb>
                                              <Link
                                                to={resolvers.dashboard.root()}
                                              >
                                                {t('shared:Home')}
                                              </Link>
                                              <Link
                                                to={resolvers.connections.connections()}
                                              >
                                                {t('shared:Connections')}
                                              </Link>
                                              <span>
                                                {t('connectionDetailPageTitle')}
                                              </span>
                                            </Breadcrumb>
                                            <ConnectionDetailsHeader
                                              allowEditing={true}
                                              connectionDescription={
                                                data.description
                                              }
                                              connectionIcon={data.icon}
                                              connectionName={data.name}
                                              i18nDescriptionLabel={t(
                                                'shared:Description'
                                              )}
                                              i18nDescriptionPlaceholder={t(
                                                'descriptionPlaceholder'
                                              )}
                                              i18nNamePlaceholder={t(
                                                'namePlaceholder'
                                              )}
                                              i18nUsageLabel={t('shared:Usage')}
                                              i18nUsageMessage={this.getUsedByMessage(
                                                data
                                              )}
                                              isWorking={this.state.isWorking}
                                              onChangeDescription={
                                                saveDescription
                                              }
                                              onChangeName={saveName}
                                              validate={doValidateName}
                                            />
                                            <ConnectionDetailsForm
                                              i18nCancelLabel={t(
                                                'shared:Cancel'
                                              )}
                                              i18nEditLabel={t('shared:Edit')}
                                              i18nSaveLabel={t('shared:Save')}
                                              i18nTitle={t(
                                                'detailsSectionTitle',
                                                {
                                                  connectionName: data.name,
                                                }
                                              )}
                                              i18nValidateLabel={t(
                                                'shared:Validate'
                                              )}
                                              handleSubmit={handleSubmit}
                                              isValid={isValid}
                                              isWorking={
                                                isSubmitting || isValidating
                                              }
                                              validationResults={
                                                validationResults
                                              }
                                              onCancel={cancelEditing}
                                              onValidate={validateForm}
                                            >
                                              {fields}
                                            </ConnectionDetailsForm>
                                          </>
                                        )}
                                      </WithConfigurationForm>
                                    );
                                  }}
                                </WithLoader>
                              );
                            }}
                          </WithConnection>
                        );
                      }}
                    </WithConnectionHelpers>
                  )}
                </Translation>
              )}
            </WithRouteData>
          );
        }}
      </AppContext.Consumer>
    );
  }
}